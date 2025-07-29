import { Schema, model, Document } from 'mongoose';

export interface OnboardingQuestionModel extends Document {
  readonly _id: string;
  question: string;
  order: number;
  options: string[];
}

const OnboardingQuestionSchema = new Schema<OnboardingQuestionModel>(
  {
    _id: { type: String, required: true },
    question: { type: String, required: true },
    order: { type: Number, required: true },
    options: [{ type: Array, required: true }],
  },
  {
    timestamps: true,
    collection: 'onboarding_questions',
  },
);

export const OnboardingQuestionMongoModel = model('OnboardingQuestion', OnboardingQuestionSchema);
