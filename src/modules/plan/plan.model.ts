import { Schema, model, Document } from 'mongoose';

export interface IPlanModel extends Document {
  readonly _id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  benefits: string[];
}

const planMongoSchema = new Schema<IPlanModel>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    active: { type: Boolean, default: true },
    benefits: { type: [String], required: false },
  },
  {
    timestamps: true,
    collection: 'plans',
  },
);

export const PlanMongoModel = model<IPlanModel>('Plan', planMongoSchema);
