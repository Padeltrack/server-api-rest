import { Schema, model, Document } from 'mongoose';

export interface ICounterModel extends Document {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounterModel>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const CounterMongoModel = model<ICounterModel>('Counter', counterSchema);
