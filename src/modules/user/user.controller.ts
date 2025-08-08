import { Request, Response } from 'express';
import { RoleModel, SelectRoleModel, UserMongoModel } from './user.model';
import { UpdateUserSchemaZod } from './user.dto';
import { ZodError } from 'zod';
import { PlanMongoModel } from '../plan/plan.model';
import { OrderMongoModel, SelectStatusOrderModel } from '../order/order.model';

export const getMe = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'getMe' });
  req.logger.info({ status: 'start' });

  try {
    const user = req.user;
    const orderActive = await OrderMongoModel.findOne({ userId: user._id, status: SelectStatusOrderModel.Approved });
    let usePlan = null;

    if (orderActive) {
      usePlan = await PlanMongoModel.findOne({ _id: orderActive.planId });
    }

    return res.status(200).json({ user, usePlan });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'getUsers' });
  req.logger.info({ status: 'start' });

  try {
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 10;
    const role = req.query?.role || SelectRoleModel.Student;
    const skip = (page - 1) * limit;

    const users = await UserMongoModel.find({ role }).skip(skip).limit(limit);

    return res.status(200).json({ users });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error getting users' });
  }
};

export const getCoachOrStudentUsers = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'getCoachOrStudentUsers' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 10;
    const search = req.query?.search || '';
    const skip = (page - 1) * limit;
    let role: RoleModel = SelectRoleModel.Student;

    if (me.role === SelectRoleModel.Student) {
      role = SelectRoleModel.Coach;
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

    return res.status(200).json({ users });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error getting users' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'getUserById' });
  req.logger.info({ status: 'start' });

  try {
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({
        message: 'User id is required',
      });
    }

    const user = await UserMongoModel.findOne({ _id }).populate('onboarding.answers.questionId', 'question').lean();

    return res.status(200).json({ user });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error getting users' });
  }
};

export const markVerifiedUser = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'markVerifiedUser' });
  req.logger.info({ status: 'start' });

  try {
    const idUser = req.params.id as string;

    if (!idUser) {
      return res.status(400).json({
        message: 'User id is required',
      });
    }

    const getCoachUser = await UserMongoModel.findOne({ _id: idUser, role: SelectRoleModel.Coach });

    if (!getCoachUser) {
      return res.status(404).json({
        message: 'Coach not found',
      });
    }

    const verified = !getCoachUser?.verified;
    await UserMongoModel.updateOne({ _id: idUser }, { $set: { verified } });

    return res.status(200).json({
      message: 'User marked as verified successfully',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error removing users' });
  }
};

export const markWorkedUser = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'markWorkedUser' });
  req.logger.info({ status: 'start' });

  try {
    const idUser = req.params.id as string;

    if (!idUser) {
      return res.status(400).json({
        message: 'User id is required',
      });
    }

    const getCoachUser = await UserMongoModel.findOne({ _id: idUser, role: SelectRoleModel.Coach });

    if (!getCoachUser) {
      return res.status(404).json({
        message: 'Coach not found',
      });
    }

    const worked = !getCoachUser?.worked;
    const update = { worked, verified: worked };

    await UserMongoModel.updateOne({ _id: idUser }, { $set: update });

    return res.status(200).json({
      message: 'User successfully marked as member',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error removing users' });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'updateMe' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const { gender, birthdate, wherePlay, numberPhone } = UpdateUserSchemaZod.parse(req.body);
    const fields: any = {};

    if (gender) fields['gender'] = gender;
    if (birthdate) fields['birthdate'] = birthdate;
    if (wherePlay) fields['wherePlay'] = wherePlay;
    if (numberPhone) fields['numberPhone'] = numberPhone;

    if (Object.keys(fields).length) {
      await UserMongoModel.updateOne({ _id: me._id }, { $set: fields });
    }

    return res.status(200).json({
      message: 'User updated successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error removing users' });
  }
};

export const deleteMe = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'deleteMe' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;

    await UserMongoModel.deleteOne({ _id: me._id });

    return res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error removing users' });
  }
};
