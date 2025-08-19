import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { StudentCoachesMongoModel } from './studentCoaches.model';
import { SelectRoleModel, UserMongoModel } from '../user/user.model';
import { studentCoachesAssignSchemaZod } from './studentCoaches.zod';

export const getMyAssignments = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'studentCoaches', serviceHandler: 'getMyCoaches' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 10;
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
        ...user._doc,
        ...dataUser._doc,
      };
    });

    return res.status(200).json({ users: formatted, count });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching coaches', error });
  }
};

export const getCoachesByStudent = async (req: Request, res: Response) => {
  req.logger = req.logger.child({
    service: 'studentCoaches',
    serviceHandler: 'getCoachesByStudent',
  });
  req.logger.info({ status: 'start' });

  try {
    const studentId = req.params?.studentId;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 10;
    const skip = (page - 1) * limit;

    if (!studentId) {
      return res.status(400).json({
        message: 'Student ID is required',
      });
    }

    const query = { studentId };

    const count = await StudentCoachesMongoModel.countDocuments(query);
    const coaches = await StudentCoachesMongoModel.find(query)
      .populate('coachId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    return res.status(200).json({ coaches, count });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching coaches', error });
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
        message: 'Coach not found or not a coach',
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
        message: 'Coach unassigned successfully',
      });
    } else {
      await StudentCoachesMongoModel.create({
        _id: new ObjectId().toHexString(),
        studentId: me._id,
        coachId,
      });

      return res.status(200).json({
        message: 'Coach assigned successfully',
      });
    }
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error assigning coach', error });
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
        message: 'Coach assignment not found',
      });
    }

    await StudentCoachesMongoModel.deleteOne({ studentId: me._id, _id: assignCoach });

    return res.status(200).json({
      message: 'Coach assignment removed successfully',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error removing coach assignment', error });
  }
};
