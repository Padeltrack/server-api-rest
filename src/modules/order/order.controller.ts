import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { createOrderSchema, updateOrderStatusSchema } from './order.dto';
import { OrderMongoModel, SelectStatusOrderModel } from './order.model';
import { PlanMongoModel } from '../plan/plan.model';
import { SelectRoleModel } from '../user/user.model';
import { ZodError } from 'zod';
import { uploadImageBanner } from './order.service';

export const getOrders = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'order', serviceHandler: 'getOrders' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (me.role === SelectRoleModel.Student) query['userId'] = me._id;

    const orders = await OrderMongoModel.find().populate('planId').skip(skip).limit(limit).sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching orders', error });
  }
};

export const getOrdersById = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'order', serviceHandler: 'getOrdersById' });
  req.logger.info({ status: 'start' });

  try {
    const orderId = req.params.id;

    if (!orderId) return res.status(400).json({ message: 'Order id is required' });

    const order = await OrderMongoModel.find({ _id: orderId }).populate('planId');

    return res.status(200).json({ order });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching orders', error });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'order', serviceHandler: 'createOrder' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const userId = me._id;
    const { planId, imageBase64 } = createOrderSchema.parse(req.body);

    const isPlan = await PlanMongoModel.countDocuments({ planId, active: true });
    if (!isPlan) return res.status(400).json({ message: 'Plan not found' });
    const idOrder = new ObjectId().toHexString();

    const paymentProof = await uploadImageBanner({ imageBase64, idOrder });

    const order = await OrderMongoModel.create({
      _id: idOrder, 
      status: SelectStatusOrderModel.Pending,
      userId,
      planId,
      paymentProof
    });

    return res.status(200).json({ order });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error creating order', error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'order', serviceHandler: 'updateOrderStatus' });
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

    return res.status(200).json({ updated });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error updating order', error });
  }
};
