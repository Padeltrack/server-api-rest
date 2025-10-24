import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { StudentCoachesModel, StudentCoachesMongoModel } from './studentCoaches.model';
import { SelectRoleModel, UserMongoModel } from '../user/user.model';
import { studentCoachesAssignSchemaZod } from './studentCoaches.zod';
import { formatZodErrorResponse } from '../../shared/util/zod.util';

export const getMyAssignments = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'studentCoaches', serviceHandler: 'getMyCoaches' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 150;
    const search = req.query?.search || '';
    const skip = (page - 1) * limit;

    const query: any = {};
    const match: any = {};
    const populate: any = {};

    if (search) {
      match.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (me.role === SelectRoleModel.Student) {
      query.studentId = me._id;
      populate.path = 'coachId';
      populate.match = match;
    }

    if (me.role === SelectRoleModel.Coach) {
      query.coachId = me._id;
      populate.path = 'studentId';
      populate.match = match;
    }

    const count = await StudentCoachesMongoModel.countDocuments(query);
    const users = await StudentCoachesMongoModel.find(query)
      .populate(populate)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const formatted = users.map((user: any) => {
      const dataUser = typeof user.coachId === 'object' ? user.coachId : user.studentId;
      user.coachId = null;
      user.studentId = null;
      return {
        idAssignment: user._id,
        ...user?._doc,
        ...dataUser?._doc,
      };
    });

    return res.status(200).json({
      users: formatted,
      count,
      message: req.t('coaches.list.loaded'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('coaches.list.error'), error });
  }
};

export const getCoachesByStudent = async (req: Request, res: Response) => {
  req.logger = req.logger.child({
    service: 'studentCoaches',
    serviceHandler: 'getCoachesByStudent',
  });
  req.logger.info({ status: 'start' });

  try {
    const userId = req.params?.userId;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 150;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({
        message: req.t('coaches.validation.studentIdRequired'),
      });
    }

    const getUserByRol = await UserMongoModel.findOne({ _id: userId });
    if (!getUserByRol) {
      return res.status(404).json({
        message: req.t('users.profile.notFound'),
      });
    }

    if (![SelectRoleModel.Coach, SelectRoleModel.Student].includes(getUserByRol.role as any)) {
      return res.status(400).json({
        message: req.t('users.role.invalid'),
      });
    }

    let query: Partial<Pick<StudentCoachesModel, 'studentId' | 'coachId'>> = {};

    if (getUserByRol.role === SelectRoleModel.Student) {
      query = { studentId: userId };
    } else if (getUserByRol.role === SelectRoleModel.Coach) {
      query = { coachId: userId };
    }

    if (!Object.keys(query).length) {
      return res.status(404).json({
        message: req.t('common.badRequest'),
      });
    }

    const count = await StudentCoachesMongoModel.countDocuments(query);
    const users = await StudentCoachesMongoModel.find(query)
      .populate(query.coachId ? 'studentId' : 'coachId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      users,
      count,
      message: req.t('coaches.list.loaded'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('coaches.list.error'), error });
  }
};

export const assignCoach = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'studentCoaches', serviceHandler: 'assignCoach' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const { coachId } = studentCoachesAssignSchemaZod.parse(req.body);

    const getCoach = await UserMongoModel.countDocuments({
      _id: coachId,
      role: SelectRoleModel.Coach,
    });
    if (!getCoach) {
      return res.status(404).json({
        message: req.t('coaches.validation.notFound'),
      });
    }

    const existingAssignment = await StudentCoachesMongoModel.countDocuments({
      studentId: me._id,
      coachId,
    });

    if (existingAssignment) {
      await StudentCoachesMongoModel.deleteOne({
        studentId: me._id,
        coachId,
      });

      return res.status(200).json({
        message: req.t('coaches.unassign.success'),
      });
    } else {
      await StudentCoachesMongoModel.create({
        _id: new ObjectId().toHexString(),
        studentId: me._id,
        coachId,
      });

      return res.status(200).json({
        message: req.t('coaches.assign.success'),
      });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(formatZodErrorResponse(error, req.t));
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('coaches.assign.error'), error });
  }
};

export const removeAssignCoach = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'studentCoaches', serviceHandler: 'removeAssignCoach' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const assignCoach = req.params.id;

    const existingAssignment = await StudentCoachesMongoModel.countDocuments({
      studentId: me._id,
      _id: assignCoach,
    });

    if (!existingAssignment) {
      return res.status(404).json({
        message: req.t('coaches.unassign.notFound'),
      });
    }

    await StudentCoachesMongoModel.deleteOne({ studentId: me._id, _id: assignCoach });

    return res.status(200).json({
      message: req.t('coaches.unassign.removed'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('coaches.unassign.error'), error });
  }
};
