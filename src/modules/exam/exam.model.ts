import { Schema, model, Document } from 'mongoose';

export interface ExamQuestionModel extends Document {
  readonly _id: string;
  question: string;
  order: number;
}

const ExamQuestionSchema = new Schema<ExamQuestionModel>({
  _id: { type: String, required: true },
  question: { type: String, required: true },
  order: { type: Number, required: true },
});

export const ExamQuestionMongoModel = model<ExamQuestionModel>('ExamQuestion', ExamQuestionSchema);
