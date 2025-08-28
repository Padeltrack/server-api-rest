import { Request, Response, NextFunction } from 'express';
import { IOrderModel, OrderMongoModel, SelectStatusOrderModel } from '../modules/order/order.model';
import { SelectRoleModel } from '../modules/user/user.model';

declare module 'express-serve-static-core' {
  interface Request {
    order: IOrderModel;
  }
}

export const activeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const isStudent = user.role === SelectRoleModel.Student;
    const isCoach = user.role === SelectRoleModel.Coach;
    const orderActive = await OrderMongoModel.findOne({
      userId: user._id,
      status: SelectStatusOrderModel.Approved,
      isCoach,
    })
      .populate({
        path: 'planId',
        match: { isCoach: false },
      })
      .sort({ createdAt: -1 });

    if (!orderActive && (isStudent || isCoach)) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    req.order = orderActive as IOrderModel;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Order not active' });
  }
};

export const activeOrderCoachCenter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const isCoach = user.role === SelectRoleModel.Coach;

    if (!isCoach) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    const orderActive = await OrderMongoModel.findOne({
      userId: user._id,
      status: SelectStatusOrderModel.Approved,
      isCoach,
    })
      .populate({
        path: 'planId',
        match: { isCoach: true },
      })
      .sort({ createdAt: -1 });

    if (!orderActive && isCoach) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    req.order = orderActive as IOrderModel;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Order not active' });
  }
};
