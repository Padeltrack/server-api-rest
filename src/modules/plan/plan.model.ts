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

export interface IPlanTranslation {
  name: string;
  description: string;
  benefits: string[];
}

export interface IPlanModel extends Document {
  readonly _id: string;
  price: number;
  isCoach: boolean;
  daysActive: DaysActiveModel;
  active: boolean;
  translate: {
    es: IPlanTranslation;
    en: IPlanTranslation;
    pt: IPlanTranslation;
  };
}

const planTranslationSchema = new Schema<IPlanTranslation>({
  name: { type: String, required: false, default: "" },
  description: { type: String, required: false, default: "" },
  benefits: { type: [String], required: false, default: [] },
}, { _id: false });

const planMongoSchema = new Schema<IPlanModel>(
  {
    _id: { type: String, required: true },
    price: { type: Number, required: true },
    isCoach: { type: Boolean, required: true, default: false },
    daysActive: { type: Number, required: true, default: SelectDaysActiveModel.ONE_MONTH },
    active: { type: Boolean, default: true },
    translate: {
      es: { type: planTranslationSchema, required: true },
      en: { type: planTranslationSchema, required: true },
      pt: { type: planTranslationSchema, required: true },
    },
  },
  {
    timestamps: true,
    collection: 'plans',
  },
);

export const PlanMongoModel = model<IPlanModel>('Plan', planMongoSchema);
