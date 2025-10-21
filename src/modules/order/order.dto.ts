import { z } from 'zod';
import { SelectStatusOrderModel } from './order.model';

export const createOrderSchema = z.object({
  planId: z.string({ required_error: 'orders.validation.planRequired' }),
  imageBase64: z.string({ required_error: 'orders.payment.proofRequired' }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    [
      SelectStatusOrderModel.Pending,
      SelectStatusOrderModel.Approved,
      SelectStatusOrderModel.Rejected,
      SelectStatusOrderModel.Cancelled,
    ],
    { required_error: 'orders.validation.statusRequired' },
  ),
  messageRejected: z.string().max(50, { message: 'orders.validation.rejectionTooLong' }).optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
