import { Request, Response, NextFunction } from 'express';
import { OrderMongoModel, SelectStatusOrderModel } from '../modules/order/order.model';

export const activeOrder =
  () =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const orderActive = await OrderMongoModel.countDocuments({ userId: user._id, status: SelectStatusOrderModel.Approved });
    if (!orderActive) {
        return res.status(403).json({
            message: 'Access denied'
        });
    }
    next();
};
