import { Request, Response } from 'express';
import { SelectRoleModel, UserMongoModel } from './user.model';

export const getMe = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'getMe' });
  req.logger.info({ status: 'start' });

  try {
    const user = req.user;
    return res.status(200).json({ user });
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

export const deleteMe = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'users', serviceHandler: 'deleteMe' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;

    await UserMongoModel.deleteOne({ _id: me._id });

    return res.status(200).json({});
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error removing users' });
  }
};
