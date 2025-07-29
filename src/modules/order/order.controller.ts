import { Request, Response } from 'express';
import { createOrderSchema, updateOrderStatusSchema } from './order.dto';
import { OrderMongoModel } from './order.model';
import { PlanMongoModel } from '../plan/plan.model';
import { UserMongoModel } from '../user/user.model';

export const createOrder = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'orders', serviceHandler: 'createOrder' });
  req.logger.info({ status: 'start' });

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  try {
    const { userId, planId } = parsed.data;

    const isUser = await UserMongoModel.countDocuments({ userId });
    if (!isUser) return res.status(400).json({ message: 'User not found' });

    const isPlan = await PlanMongoModel.countDocuments({ planId, active: true });
    if (!isPlan) return res.status(400).json({ message: 'Plan not found' });

    const order = await OrderMongoModel.create({
      userId,
      planId,
    });

    res.status(201).json(order);
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({ message: 'Error creating order', error });
  }
};

export const getOrdersByUser = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'orders', serviceHandler: 'getOrdersByUser' });
  req.logger.info({ status: 'start' });

  try {
    const orders = await OrderMongoModel.find({ userId: req.user._id }).populate('planId');
    res.status(200).json(orders);
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'orders', serviceHandler: 'updateOrderStatus' });
  req.logger.info({ status: 'start' });

  const { id } = req.params;
  const parsed = updateOrderStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  try {
    const updated = await OrderMongoModel.findByIdAndUpdate(
      id,
      { status: parsed.data.status },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: 'Order not found' });

    res.status(200).json(updated);
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({ message: 'Error updating order', error });
  }
};
