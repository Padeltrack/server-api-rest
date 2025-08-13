import { Schema, model, Document } from 'mongoose';

export enum SelectStatusOrderModel {
  Completed = 'Completed',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export type StatusOrderModel =
  | SelectStatusOrderModel.Completed
  | SelectStatusOrderModel.Approved
  | SelectStatusOrderModel.Pending
  | SelectStatusOrderModel.Rejected;

export interface IOrderModel extends Document {
  readonly _id: string;
  userId: string;
  planId: string;
  status: StatusOrderModel;
  paymentProof?: string;
  currentWeek?: number;
  lastProgressDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderMongoSchema = new Schema<IOrderModel>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    planId: { type: String, required: true, ref: 'Plan' },
    status: {
      required: true,
      type: String,
      enum: Object.values(SelectStatusOrderModel),
      default: SelectStatusOrderModel.Pending,
    },
    paymentProof: {
      type: String,
    },
    currentWeek: { type: Number, required: false },
    lastProgressDate: { type: Date, required: false },
  },
  {
    timestamps: true,
    collection: 'orders',
  },
);

export const OrderMongoModel = model<IOrderModel>('Order', orderMongoSchema);
