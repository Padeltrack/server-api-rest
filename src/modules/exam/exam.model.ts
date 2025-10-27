import { Schema, model, Document } from 'mongoose';

export interface IExamTranslation {
  title: string;
  description: string;
}

export interface ExamQuestionnaireModel extends Document {
  readonly _id: string;
  idVideoVimeo: string;
  order: number;
  translate: {
    es: IExamTranslation;
    en: IExamTranslation;
    pt: IExamTranslation;
  };
}

const examTranslationSchema = new Schema<IExamTranslation>(
  {
    title: { type: String, required: false, default: '' },
    description: { type: String, required: false, default: '' },
  },
  { _id: false },
);

const ExamQuestionnaireSchema = new Schema<ExamQuestionnaireModel>({
  _id: { type: String, required: true },
  idVideoVimeo: { type: String, required: true },
  order: { type: Number, required: true },
  translate: {
    es: { type: examTranslationSchema, required: true },
    en: { type: examTranslationSchema, required: true },
    pt: { type: examTranslationSchema, required: true },
  },
});

export const ExamQuestionnaireMongoModel = model<ExamQuestionnaireModel>(
  'ExamQuestion',
  ExamQuestionnaireSchema,
);
