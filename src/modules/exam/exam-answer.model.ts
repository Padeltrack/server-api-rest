import { Schema, model, Document } from 'mongoose';

export const SelectStatusAnswerModel = {
  Pendiente: 'Pendiente',
  Revision: 'Revision',
  Completado: 'Completado',
  Rechazado: 'Rechazado',
} as const;

export type StatusAnswerModel = (typeof SelectStatusAnswerModel)[keyof typeof SelectStatusAnswerModel];

interface Answer {
  questionId: string;
  idVideo: string;
  answerText?: string | null;
  score?: number;
  createdAt: Date;
}

export interface ExamAnswerModel extends Document {
  readonly _id: string;
  userId: string;
  status: StatusAnswerModel;
  answers: Answer[];
  average?: number;
}

const AnswerSchema = new Schema<Answer>({
  questionId: {
    type: String,
    ref: 'ExamQuestion',
    required: true,
  },
  idVideo: {
    type: String,
    required: true,
  },
  answerText: {
    type: String,
    required: false,
    default: null,
  },
  score: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  _id: false,
});

const ExamAnswerSchema = new Schema<ExamAnswerModel>({
  _id: { type: String, required: true },
  userId: { type: String, required: true, ref: 'User' },
  status: {
    type: String,
    required: true,
    default: SelectStatusAnswerModel.Pendiente
  },
  answers: [AnswerSchema],
  average: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
}, {
  timestamps: true,
  collection: 'exam-answers',
});

export const ExamAnswerMongoModel = model<ExamAnswerModel>('ExamAnswer', ExamAnswerSchema);
