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
    const isStudents = user.role === SelectRoleModel.Student;
    const orderActive = await OrderMongoModel.findOne({
      userId: user._id,
      status: SelectStatusOrderModel.Approved,
    });

    if (!orderActive && isStudents) {
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
