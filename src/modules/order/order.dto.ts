import { z } from 'zod';
import { SelectStatusOrderModel } from './order.model';

export const createOrderSchema = z.object({
  planId: z.string({ required_error: 'El identificador del plan es requerido' }),
  imageBase64: z.string({ required_error: 'La imagen es requerida' }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    SelectStatusOrderModel.Pending,
    SelectStatusOrderModel.Approved,
    SelectStatusOrderModel.Rejected,
  ]),
  messageRejected: z.string().optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
