import { Schema, model, Document } from 'mongoose';

export const SelectTypeAccountBankModel = {
  SAVINGS: 'Savings',
  CHECKING: 'Checking',
} as const;

export type TypeAccountModel = (typeof SelectTypeAccountBankModel)[keyof typeof SelectTypeAccountBankModel];

export interface BankModel extends Document {
  readonly _id: string;
  name: string;
  typeAccount: TypeAccountModel;
  numberAccount: string;
  nameAccount: string;
  dniAccount: string;
}

const BankSchema = new Schema<BankModel>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  typeAccount: { type: String, required: true, enum: Object.values(SelectTypeAccountBankModel) },
  numberAccount: { type: String, required: true },
  nameAccount: { type: String, required: true },
  dniAccount: { type: String, required: true },
},{
  timestamps: true
});

export const BankMongoModel = model<BankModel>(
  'Bank',
  BankSchema,
);
