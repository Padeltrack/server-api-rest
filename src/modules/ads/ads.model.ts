import { Schema, model, Document } from 'mongoose';

export interface AdsModel extends Document {
  readonly _id: string;
  urlImage: string;
  link: string;
  order: number;
}

const AdsSchema = new Schema<AdsModel>(
  {
    _id: { type: String, required: true },
    urlImage: { type: String, required: true },
    link: { type: String, required: false },
    order: { type: Number, required: true, unique: true },
  },
  {
    timestamps: true,
  },
);

export const AdsMongoModel = model<AdsModel>('Ads', AdsSchema);
