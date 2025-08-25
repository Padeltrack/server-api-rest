import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { createOrderSchema, updateOrderStatusSchema } from './order.dto';
import { OrderMongoModel, SelectStatusOrderModel } from './order.model';
import { PlanMongoModel } from '../plan/plan.model';
import { SelectRoleModel, UserMongoModel } from '../user/user.model';
import { ZodError } from 'zod';
import { uploadImagePayment } from './order.service';
import { WeeklyVideoMongoModel } from '../weeklyVideo/weeklyVideo.model';
import { getVideosByWeek } from '../weeklyVideo/weeklyVideo.model.helper';
import { generateEmail } from '../mail/loadTemplate.mail';
import { sendEMail } from '../mail/sendTemplate.mail';

export const getOrders = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'order', serviceHandler: 'getOrders' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 10;
    const isCoach = req.query?.isCoach || false;
    const status = req.query?.status || '';
    const search = req.query?.search || '';
    const skip = (page - 1) * limit;

    const query: any = {};
    const match: any = {};

    if (me.role === SelectRoleModel.SuperAdmin) {
      if (isCoach) query['isCoach'] = isCoach === 'true';
      if (search) {
        match.$or = [
          { displayName: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
        // query['$or'] = [{ 'orderNumber': { $regex: search, $options: 'i' } }, match];
      }
    }

    if (status) query['status'] = status;

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
      .populate({ path: 'userId', match })
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
    const isCoach = me.role === SelectRoleModel.Coach;
    const { planId, imageBase64 } = createOrderSchema.parse(req.body);

    const getPlan = await PlanMongoModel.findOne({ _id: planId, active: true });
    if (!getPlan) {
      return res.status(400).json({
        message: 'Plan not found',
      });
    }

    if (getPlan.isCoach && !isCoach) {
      return res.status(400).json({
        message: 'You are not a coach',
      });
    }

    if (isCoach) {
      const isOrderCoachPending = await OrderMongoModel.aggregate([
        {
          $match: {
            userId,
            $or: [
              { status: SelectStatusOrderModel.Pending },
              { status: SelectStatusOrderModel.Approved },
            ],
          },
        },
        {
          $lookup: {
            from: 'plans',
            localField: 'planId',
            foreignField: '_id',
            as: 'plan',
          },
        },
        { $unwind: '$plan' },
        {
          $match: {
            'plan.isCoach': getPlan.isCoach,
          },
        },
      ]);

      if (isOrderCoachPending.length) {
        return res.status(400).json({
          message: 'You have a pending order',
        });
      }
    } else {
      const isOrderPending = await OrderMongoModel.countDocuments({
        userId,
        isCoach: false,
        $or: [
          { status: SelectStatusOrderModel.Pending },
          { status: SelectStatusOrderModel.Approved },
        ],
      });

      if (isOrderPending) {
        return res.status(400).json({
          message: 'You have a pending order',
        });
      }
    }

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

    const newOrderEmail = await generateEmail({
      template: 'newOrder',
      variables: {
        displayName: me.displayName,
        orderNumber: order.orderNumber,
        email: me.email,
        supportEmail: 'padeltrackhub@gmail.com',
        companyName: 'Padel Track',
        orderDate: new Date().toLocaleString(),
        orderTotal: `${getPlan.price}`,
        orderItems: [
          {
            name: `${getPlan.name}`,
            quantity: '1',
            price: `${getPlan.price}`,
          },
        ] as any,
      },
    });

    const msg = {
      from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      to: me.email,
      subject: 'Recibimos tu orden de Padel Track',
      text: '-',
      html: newOrderEmail,
    };

    sendEMail({ data: msg });

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

    if (status === getOrder.status) {
      return res.status(400).json({
        message: 'Status already updated',
      });
    }

    if (
      status === SelectStatusOrderModel.Cancelled &&
      getOrder.status !== SelectStatusOrderModel.Approved
    ) {
      return res.status(400).json({
        message: 'Order not approved',
      });
    }

    const getPlan = await PlanMongoModel.findOne({ _id: getOrder.planId });
    if (!getPlan) {
      return res.status(404).json({
        message: 'Plan not found',
      });
    }

    const getUser = await UserMongoModel.findOne({ _id: getOrder.userId });
    if (!getUser) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const isStatusForMessageRejected = [
      SelectStatusOrderModel.Rejected,
      SelectStatusOrderModel.Cancelled,
    ].includes(getOrder.status);
    if (isStatusForMessageRejected && !messageRejected) {
      return res.status(400).json({
        message: 'El mensaje de rechazo es requerido',
      });
    }
    if (isStatusForMessageRejected && (messageRejected ?? '').length > 50) {
      return res
        .status(400)
        .json({ message: 'El mensaje de rechazo no puede tener mas de 50 caracteres' });
    }

    if (status === SelectStatusOrderModel.Approved) {
      if (getOrder.status === SelectStatusOrderModel.Rejected) {
        fieldsUpdated.messageRejected = null;
      }

      fieldsUpdated.approvedOrderDate = new Date();
      fieldsUpdated.currentWeek = 1;
      fieldsUpdated.lastProgressDate = new Date();
    } else if (status === SelectStatusOrderModel.Rejected) {
      fieldsUpdated.messageRejected = messageRejected;
      fieldsUpdated.approvedOrderDate = undefined;
      fieldsUpdated.currentWeek = undefined;
      fieldsUpdated.lastProgressDate = undefined;
    } else if (status === SelectStatusOrderModel.Cancelled) {
      fieldsUpdated.cancellationDate = new Date();
      fieldsUpdated.messageRejected = messageRejected;
    }

    const updated = await OrderMongoModel.findByIdAndUpdate({ _id: orderId }, fieldsUpdated, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: 'Order not found' });

    const isApproved = fieldsUpdated.status === SelectStatusOrderModel.Approved;
    const isCancel = fieldsUpdated.status === SelectStatusOrderModel.Cancelled;
    const isStudent = getUser.role === SelectRoleModel.Student;
    const isPlanNotCoach = getPlan.isCoach === false;

    if (isApproved && isStudent && isPlanNotCoach) {
      const week = fieldsUpdated.currentWeek;
      await WeeklyVideoMongoModel.create({
        _id: new ObjectId().toHexString(),
        orderId,
        week,
        videos: await getVideosByWeek({ week }),
      });
    }

    const statusOrderEmail = await generateEmail({
      template: isCancel ? 'orderCancel' : isApproved ? 'orderApproved' : 'orderReject',
      variables: {
        displayName: getUser.displayName,
        orderNumber: getOrder.orderNumber,
        orderDate: new Date(getOrder.createdAt).toLocaleString(),
        rejectionReason: fieldsUpdated?.messageRejected || '',
        email: getUser.email,
        supportEmail: 'padeltrackhub@gmail.com',
        companyName: 'Padel Track',
        cancellationDate: new Date().toLocaleString(),
        orderTotal: `${getPlan.price}`,
        orderItems: [
          {
            name: `${getPlan.name}`,
            quantity: '1',
            price: `${getPlan.price}`,
          },
        ] as any,
      },
    });

    const msg = {
      from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      to: getUser.email,
      subject: isCancel
        ? 'Tu orden fue cancelada en Padel Track'
        : isApproved
          ? 'Tu orden fue aprobada en Padel Track'
          : 'Tu orden fue rechazada en Padel Track',
      text: '-',
      html: statusOrderEmail,
    };

    sendEMail({ data: msg });

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
