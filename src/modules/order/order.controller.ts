import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { createOrderSchema, updateOrderStatusSchema } from './order.dto';
import { OrderMongoModel, SelectStatusOrderModel } from './order.model';
import { PlanMongoModel } from '../plan/plan.model';
import { SelectRoleModel } from '../user/user.model';
import { ZodError } from 'zod';
import { uploadImagePayment } from './order.service';
import { WeeklyVideoMongoModel } from '../weeklyVideo/weeklyVideo.model';
import { getVideosByWeek } from '../weeklyVideo/weeklyVideo.model.helper';

export const getOrders = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'order', serviceHandler: 'getOrders' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 10;
    const isCoach = req.query?.isCoach || false;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (me.role === SelectRoleModel.SuperAdmin) {
      if (isCoach) query['isCoach'] = isCoach === 'true';
    }

    if (me.role === SelectRoleModel.Coach) {
      query['userId'] = me._id;
      query['isCoach'] = true;
    }

    if (me.role === SelectRoleModel.Student) {
      query['userId'] = me._id;
      query['isCoach'] = false;
    }

    const count = await OrderMongoModel.countDocuments(query);
    const orders = await OrderMongoModel.find(query)
      .populate('planId')
      .populate('userId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders, count });
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

    const order = await OrderMongoModel.findOne({ _id: orderId })
      .populate('planId')
      .populate('userId');

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

    const isPlan = await PlanMongoModel.countDocuments({ _id: planId, active: true });
    if (!isPlan) return res.status(400).json({ message: 'Plan not found' });

    const isOrderPending = await OrderMongoModel.countDocuments({
      userId,
      $or: [
        { status: SelectStatusOrderModel.Pending },
        { status: SelectStatusOrderModel.Approved },
      ],
    });
    if (isOrderPending) return res.status(400).json({ message: 'You have a pending order' });

    const idOrder = new ObjectId().toHexString();
    const paymentProof = await uploadImagePayment({ imageBase64, idOrder });

    const order = await OrderMongoModel.create({
      _id: idOrder,
      status: SelectStatusOrderModel.Pending,
      userId,
      planId,
      paymentProof,
      isCoach: me.role === SelectRoleModel.Coach,
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

  try {
    const orderId = req.params.id;
    const { status, messageRejected } = updateOrderStatusSchema.parse(req.body);
    const fieldsUpdated: any = { status };

    const getOrder = await OrderMongoModel.findOne({ _id: orderId });
    if (!getOrder) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    if (status === SelectStatusOrderModel.Approved) {
      if (getOrder.status === SelectStatusOrderModel.Rejected) {
        fieldsUpdated.messageRejected = null;
      }

      fieldsUpdated.currentWeek = 1;
      fieldsUpdated.lastProgressDate = new Date();
    } else if (status === SelectStatusOrderModel.Rejected) {
      if (messageRejected && messageRejected?.length > 50) {
        return res
          .status(400)
          .json({ message: 'El mensaje de rechazo no puede tener mas de 50 caracteres' });
      }

      fieldsUpdated.messageRejected = messageRejected;
      fieldsUpdated.currentWeek = undefined;
      fieldsUpdated.lastProgressDate = undefined;
    }

    const updated = await OrderMongoModel.findByIdAndUpdate({ _id: orderId }, fieldsUpdated, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: 'Order not found' });

    if (fieldsUpdated.status === SelectStatusOrderModel.Approved) {
      const week = fieldsUpdated.currentWeek;
      await WeeklyVideoMongoModel.create({
        _id: new ObjectId().toHexString(),
        orderId,
        week,
        videos: await getVideosByWeek({ week }),
      });
    }

    return res.status(200).json({ order: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error updating order', error });
  }
};
