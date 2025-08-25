import { Schema, model, Document } from 'mongoose';
import { CounterMongoModel } from '../counter/counter.model';

export enum SelectStatusOrderModel {
  Completed = 'Completed',
  Expired = 'Expired',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}

export type StatusOrderModel =
  | SelectStatusOrderModel.Completed
  | SelectStatusOrderModel.Expired
  | SelectStatusOrderModel.Approved
  | SelectStatusOrderModel.Pending
  | SelectStatusOrderModel.Rejected
  | SelectStatusOrderModel.Cancelled;

export interface IOrderModel extends Document {
  readonly _id: string;
  orderNumber: string;
  userId: string;
  planId: string;
  status: StatusOrderModel;
  paymentProof?: string;
  currentWeek?: number;
  messageRejected?: string | null;
  isCoach: boolean;
  completedOrderDate?: Date;
  approvedOrderDate?: Date;
  cancellationDate?: Date;
  lastProgressDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderMongoSchema = new Schema<IOrderModel>(
  {
    _id: { type: String, required: true },
    orderNumber: { type: String, unique: true },
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
    messageRejected: { type: String, required: false },
    isCoach: { type: Boolean, required: true, default: false },
    completedOrderDate: { type: Date, required: false },
    approvedOrderDate: { type: Date, required: false },
    cancellationDate: { type: Date, required: false },
    currentWeek: { type: Number, required: false },
    lastProgressDate: { type: Date, required: false },
  },
  {
    timestamps: true,
    collection: 'orders',
  },
);

orderMongoSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await CounterMongoModel.findByIdAndUpdate(
      { _id: 'orderNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const paddedNumber = counter.seq.toString().padStart(6, '0');
    this.orderNumber = `ORDER${paddedNumber}`;
  }
  next();
});

export const OrderMongoModel = model<IOrderModel>('Order', orderMongoSchema);
