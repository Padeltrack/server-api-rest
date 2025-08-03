import { Schema, model, Document } from 'mongoose';

export interface ExamQuestionnaireModel extends Document {
  readonly _id: string;
  title: string;
  description: string;
  idVideoVimeo: string;
  order: number;
}

const ExamQuestionnaireSchema = new Schema<ExamQuestionnaireModel>({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  idVideoVimeo: { type: String, required: true },
  order: { type: Number, required: true },
});

export const ExamQuestionnaireMongoModel = model<ExamQuestionnaireModel>(
  'ExamQuestion',
  ExamQuestionnaireSchema,
);
