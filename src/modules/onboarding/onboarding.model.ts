import { Schema, model, Document } from 'mongoose';

export interface IOnboardingTranslation {
  question: string;
  options: string[];
}

export interface OnboardingQuestionModel extends Document {
  readonly _id: string;
  order: number;
  translate: {
    es: IOnboardingTranslation;
    en: IOnboardingTranslation;
    pt: IOnboardingTranslation;
  };
}

const onboardingTranslationSchema = new Schema<IOnboardingTranslation>({
  question: { type: String, required: false, default: "" },
  options: { type: [String], required: false, default: [] },
}, { _id: false });

const OnboardingQuestionSchema = new Schema<OnboardingQuestionModel>(
  {
    _id: { type: String, required: true },
    order: { type: Number, required: true },
    translate: {
      es: { type: onboardingTranslationSchema, required: true },
      en: { type: onboardingTranslationSchema, required: true },
      pt: { type: onboardingTranslationSchema, required: true },
    },
  },
  {
    timestamps: true,
    collection: 'onboarding_questions',
  },
);

export const OnboardingQuestionMongoModel = model('OnboardingQuestion', OnboardingQuestionSchema);
