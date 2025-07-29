import { z } from 'zod';
import { SelectStatusOrderModel } from './order.model';

export const createOrderSchema = z.object({
  userId: z.string(),
  planId: z.string(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    SelectStatusOrderModel.Pending,
    SelectStatusOrderModel.Approved,
    SelectStatusOrderModel.Rejected,
  ]),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
