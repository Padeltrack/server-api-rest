import { Schema, model, Document } from 'mongoose';

export enum SelectStatusOrderModel {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export type StatusOrderModel =
  | SelectStatusOrderModel.Approved
  | SelectStatusOrderModel.Pending
  | SelectStatusOrderModel.Rejected;

export interface IOrderModel extends Document {
  readonly _id: string;
  userId: string;
  planId: string;
  status: StatusOrderModel;
  paymentProof?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderMongoSchema = new Schema<IOrderModel>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    planId: { type: String, required: true, ref: 'Plan' },
    status: {
      type: String,
      enum: Object.values(SelectStatusOrderModel),
      default: SelectStatusOrderModel.Pending,
    },
    paymentProof: { type: String },
  },
  {
    timestamps: true,
    collection: 'orders',
  },
);

export const OrderMongoModel = model<IOrderModel>('Order', orderMongoSchema);
