import { Schema, model, Document } from 'mongoose';

export enum SelectDaysActiveModel {
  ONE_MONTH = 30,
  THREE_MONTHS = 90,
  TWELVE_MONTHS = 365,
}

export type DaysActiveModel =
  | SelectDaysActiveModel.ONE_MONTH
  | SelectDaysActiveModel.THREE_MONTHS
  | SelectDaysActiveModel.TWELVE_MONTHS;

export interface IPlanModel extends Document {
  readonly _id: string;
  name: string;
  description: string;
  price: number;
  isCoach: boolean;
  daysActive: DaysActiveModel;
  active: boolean;
  benefits: string[];
}

const planMongoSchema = new Schema<IPlanModel>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    isCoach: { type: Boolean, required: true, default: false },
    daysActive: { type: Number, required: true, default: SelectDaysActiveModel.ONE_MONTH },
    active: { type: Boolean, default: true },
    benefits: { type: [String], required: false },
  },
  {
    timestamps: true,
    collection: 'plans',
  },
);

export const PlanMongoModel = model<IPlanModel>('Plan', planMongoSchema);
