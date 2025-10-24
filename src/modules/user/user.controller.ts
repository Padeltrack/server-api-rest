import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { RoleModel, SelectRoleModel, UserModel, UserMongoModel } from './user.model';
import { CreateAdminSchemaZod, UpdateUserSchemaZod } from './user.dto';
import { ZodError } from 'zod';
import { PlanMongoModel } from '../plan/plan.model';
import { OrderMongoModel } from '../order/order.model';
import { formatZodErrorResponse } from '../../shared/util/zod.util';
import {
  generateUniqueUserName,
  removeRelationUserModel,
  uploadImagePhotoUser,
} from './user.helper';
import { StudentCoachesMongoModel } from '../studentCoaches/studentCoaches.model';
import { sendEMail } from '../mail/sendTemplate.mail';
import { generateEmail } from '../mail/loadTemplate.mail';
import { getTextBeforeAtEmail } from '../../shared/util/string.util';
import { ADMINS_EMAILS } from './user.constant';

export const getMe = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'getMe' });
  req.logger.info({ status: 'start' });

  try {
    const user = req.user;
    const isCoach = user.role === SelectRoleModel.Coach;
    let orders = [];
    const plans = [];

    if (isCoach) {
      const [coachOrder] = await OrderMongoModel.aggregate([
        { $match: { userId: user._id } },
        {
          $lookup: {
            from: 'plans',
            localField: 'planId',
            foreignField: '_id',
            as: 'planId',
          },
        },
        { $unwind: '$planId' },
        { $match: { 'planId.isCoach': true } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
      ]);

      const [normalOrder] = await OrderMongoModel.aggregate([
        { $match: { userId: user._id } },
        {
          $lookup: {
            from: 'plans',
            localField: 'planId',
            foreignField: '_id',
            as: 'planId',
          },
        },
        { $unwind: '$planId' },
        { $match: { 'planId.isCoach': false } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
      ]);

      const cleanOrders = [coachOrder, normalOrder].filter(
        order => order !== null && order !== undefined,
      );

      orders = cleanOrders.map((order: any) => {
        if (order?.planId) plans.push(order.planId);
        return {
          ...order,
          planId: order.planId?._id,
        };
      });
    } else {
      const lastOrder = await OrderMongoModel.findOne({ userId: user._id, isCoach }).sort({
        createdAt: -1,
      });
      if (lastOrder) orders.push(lastOrder);

      if (lastOrder) {
        const getPlan = await PlanMongoModel.findOne({ _id: lastOrder.planId, isCoach });
        if (getPlan) plans.push(getPlan);
      }
    }

    return res.status(200).json({ user, plans, orders });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('errors.unauthorized') });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'getUsers' });
  req.logger.info({ status: 'start' });

  try {
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 150;
    const search = req.query?.search || '';
    const gender = req.query?.gender || '';
    const level = req.query?.level || '';
    const verified = req.query?.verified || '';
    const worked = req.query?.worked || '';
    const role = req.query?.role || SelectRoleModel.Student;
    const skip = (page - 1) * limit;

    let query: any = { role };

    if (verified) {
      if (verified === 'true') query['verified'] = true;
      else {
        query.$or = [{ verified: false }, { verified: { $exists: false } }];
      }
    }
    if (worked) {
      if (worked === 'true') query['worked'] = true;
      else {
        query.$or = [{ worked: false }, { worked: { $exists: false } }];
      }
    }
    if (gender) query.gender = gender;
    if (level) query.level = level;
    if (search) {
      const paramsSearch = [
        { displayName: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
      if (query?.$or?.length) {
        query.$and = [
          {
            $or: query.$or,
          },
          {
            $or: paramsSearch,
          },
        ];
        delete query.$or;
      } else query.$or = paramsSearch;
    }

    const count = await UserMongoModel.countDocuments(query);
    const users = await UserMongoModel.find(query).skip(skip).limit(limit);

    return res.status(200).json({ users, count });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('users.list.error') });
  }
};

export const getCoachOrStudentUsers = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'getCoachOrStudentUsers' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 150;
    const search = req.query?.search || '';
    const skip = (page - 1) * limit;
    let role: RoleModel = SelectRoleModel.Student;
    let ids: string[] = [];

    if (me.role === SelectRoleModel.Student) {
      role = SelectRoleModel.Coach;
      const gerAssign = await StudentCoachesMongoModel.find({ studentId: me._id }).select(
        'coachId',
      );
      ids = gerAssign.map(_id => _id.coachId);
    } else {
      role = SelectRoleModel.Student;
      const gerAssign = await StudentCoachesMongoModel.find({ coachId: me._id }).select(
        'studentId',
      );
      ids = gerAssign.map(_id => _id.studentId);
    }

    const query: any = { role };

    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await UserMongoModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
    const priorityUsers: UserModel[] = [];
    const otherUsers: UserModel[] = [];

    users.forEach(u => {
      if (ids.includes(u._id)) {
        priorityUsers.push(u);
      } else {
        otherUsers.push(u);
      }
    });

    const priorityUsersOrdered = ids
      .map(id => priorityUsers.find(u => u._id === id))
      .filter(Boolean);

    const usersSorted = [...priorityUsersOrdered, ...otherUsers];

    return res.status(200).json({ users: usersSorted });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('users.list.error') });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'getUserById' });
  req.logger.info({ status: 'start' });

  try {
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({
        message: req.t('users.validation.idRequired'),
      });
    }

    const user = await UserMongoModel.findOne({ _id })
      .populate('onboarding.answers.questionId', 'question')
      .lean();

    return res.status(200).json({ user });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('users.list.error') });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'createAdmin' });
  req.logger.info({ status: 'start' });

  try {
    const dataAdmin = CreateAdminSchemaZod.parse(req.body);
    const { displayName, email, gender } = dataAdmin;

    const getUser = await UserMongoModel.countDocuments({ email });
    if (getUser) {
      return res.status(400).json({
        message: req.t('users.validation.alreadyExists'),
      });
    }

    await UserMongoModel.create({
      _id: new ObjectId().toHexString(),
      displayName: displayName || getTextBeforeAtEmail(email || ''),
      userName: await generateUniqueUserName(
        (displayName || getTextBeforeAtEmail(email || '')) ?? '',
      ),
      email,
      gender,
      role: SelectRoleModel.SuperAdmin,
    });

    return res.status(200).json({
      message: req.t('users.create.adminCreated'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('users.create.error') });
  }
};

export const markVerifiedUser = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'markVerifiedUser' });
  req.logger.info({ status: 'start' });

  try {
    const idUser = req.params.id as string;

    if (!idUser) {
      return res.status(400).json({
        message: req.t('users.validation.idRequired'),
      });
    }

    const getCoachUser = await UserMongoModel.findOne({ _id: idUser, role: SelectRoleModel.Coach });

    if (!getCoachUser) {
      return res.status(404).json({
        message: req.t('users.verification.notFound'),
      });
    }

    const verified = !getCoachUser?.verified;
    await UserMongoModel.updateOne({ _id: idUser }, { $set: { verified } });

    return res.status(200).json({
      message: req.t('users.verification.success'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('users.verification.error') });
  }
};

export const markWorkedUser = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'markWorkedUser' });
  req.logger.info({ status: 'start' });

  try {
    const idUser = req.params.id as string;

    if (!idUser) {
      return res.status(400).json({
        message: req.t('users.validation.idRequired'),
      });
    }

    const getCoachUser = await UserMongoModel.findOne({ _id: idUser, role: SelectRoleModel.Coach });

    if (!getCoachUser) {
      return res.status(404).json({
        message: req.t('users.verification.notFound'),
      });
    }

    const worked = !getCoachUser?.worked;
    const update = { worked, verified: worked };

    await UserMongoModel.updateOne({ _id: idUser }, { $set: update });

    return res.status(200).json({
      message: req.t('users.verification.memberSuccess'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('users.delete.error') });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'updateMe' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const {
      birthdate,
      wherePlay,
      numberPhone,
      category,
      photo,
      displayName,
      countryOfOrigin,
      countryOfResidence,
      cityOfResidence,
      dominantHand,
      matchPosition,
      playStyle,
      injuryHistory,
      desiredPhysicalTrainingType,
      competitionGender,
      competitionCategory,
      frequencyClub,
      languagesSpoken,
      highestCertification,
      complementaryTraining,
      studentsTrained,
      workClub,
      yearsExperience,
      successStories,
      mainCompetitionMotivation,
      gymPartnershipMatching,
      physicalPriority,
    } = UpdateUserSchemaZod.parse(req.body);
    const fields: any = {};

    if (birthdate) fields['birthdate'] = birthdate;
    if (wherePlay) fields['wherePlay'] = wherePlay;
    if (numberPhone) fields['numberPhone'] = numberPhone;
    if (displayName) fields['displayName'] = displayName;
    if (category) fields['category'] = category;
    if (countryOfOrigin) fields['countryOfOrigin'] = countryOfOrigin;
    if (countryOfResidence) fields['countryOfResidence'] = countryOfResidence;
    if (cityOfResidence) fields['cityOfResidence'] = cityOfResidence;
    if (competitionGender) fields['competitionGender'] = competitionGender;
    if (dominantHand) fields['dominantHand'] = dominantHand;
    if (matchPosition) fields['matchPosition'] = matchPosition;
    if (playStyle) fields['playStyle'] = playStyle;
    if (languagesSpoken) fields['languagesSpoken'] = languagesSpoken;
    if (injuryHistory) fields['injuryHistory'] = injuryHistory;
    if (competitionCategory) fields['competitionCategory'] = competitionCategory;
    if (workClub) fields['workClub'] = workClub;
    if (Array.isArray(desiredPhysicalTrainingType))
      fields['desiredPhysicalTrainingType'] = desiredPhysicalTrainingType;
    if (highestCertification) fields['highestCertification'] = highestCertification;
    if (Array.isArray(complementaryTraining))
      fields['complementaryTraining'] = complementaryTraining;
    if (Array.isArray(studentsTrained)) fields['studentsTrained'] = studentsTrained;
    if (successStories) fields['successStories'] = successStories;
    if (mainCompetitionMotivation) fields['mainCompetitionMotivation'] = mainCompetitionMotivation;
    if (typeof gymPartnershipMatching === 'boolean')
      fields['gymPartnershipMatching'] = gymPartnershipMatching;
    if (frequencyClub) fields['frequencyClub'] = frequencyClub;
    if (physicalPriority) fields['physicalPriority'] = physicalPriority;
    if (yearsExperience) fields['yearsExperience'] = yearsExperience;

    if (photo) {
      const photoUser = await uploadImagePhotoUser({ imageBase64: photo, idUser: me._id });
      fields['photo'] = photoUser;
    }

    if (Object.keys(fields).length) {
      await UserMongoModel.updateOne({ _id: me._id }, { $set: fields });
    }

    return res.status(200).json({
      message: req.t('users.update.success'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(formatZodErrorResponse(error, req.t));
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('users.update.error') });
  }
};

export const deleteMe = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'deleteMe' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const isCoach = me.role === SelectRoleModel.Coach;

    if (ADMINS_EMAILS.includes(me.email)) {
      return res.status(400).json({
        message: req.t('users.delete.cannotDelete'),
      });
    }

    await UserMongoModel.deleteOne({ _id: me._id });
    await removeRelationUserModel({ userId: me._id });

    if (isCoach) {
      await StudentCoachesMongoModel.deleteMany({ coachId: me._id });
    } else {
      await StudentCoachesMongoModel.deleteMany({ studentId: me._id });
    }

    const deleteAccountEmail = await generateEmail({
      template: 'deleteAccount',
      language: req.language || 'es',
      variables: {
        displayName: me.displayName,
        email: me.email,
        supportEmail: 'padeltrackhub@gmail.com',
        helpCenterUrl: 'https://padeltrack.app',
        companyName: 'PadelTrack',
        deletionDate: new Date().toLocaleString(),
      },
    });

    const msg = {
      from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      to: me.email,
      subject: req.t('emails.subjects.deleteAccount'),
      text: '-',
      html: deleteAccountEmail,
    };

    sendEMail({ data: msg });

    return res.status(200).json({
      message: req.t('users.delete.success'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('users.delete.error') });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'deleteUser' });
  req.logger.info({ status: 'start' });

  try {
    const userId = req.params.id;

    const getUser = await UserMongoModel.findOne({ _id: userId });
    if (!getUser) {
      return res.status(404).json({
        message: req.t('users.profile.notFound'),
      });
    }

    if (ADMINS_EMAILS.includes(getUser.email)) {
      return res.status(400).json({
        message: req.t('users.delete.cannotDelete'),
      });
    }

    const isCoach = getUser.role === SelectRoleModel.Coach;

    await UserMongoModel.deleteOne({ _id: userId });
    await removeRelationUserModel({ userId });

    if (isCoach) {
      await StudentCoachesMongoModel.deleteMany({ coachId: getUser._id });
    } else {
      await StudentCoachesMongoModel.deleteMany({ studentId: getUser._id });
    }

    const deleteAccountEmail = await generateEmail({
      template: 'deleteAccount',
      language: req.language || 'es',
      variables: {
        displayName: getUser.displayName,
        email: getUser.email,
        supportEmail: 'padeltrackhub@gmail.com',
        helpCenterUrl: 'https://padeltrack.app',
        companyName: 'PadelTrack',
        deletionDate: new Date().toLocaleString(),
      },
    });

    const msg = {
      from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      to: getUser.email,
      subject: req.t('emails.subjects.deleteAccount'),
      text: '-',
      html: deleteAccountEmail,
    };

    sendEMail({ data: msg });

    return res.status(200).json({
      message: req.t('users.delete.success'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('users.delete.error') });
  }
};
