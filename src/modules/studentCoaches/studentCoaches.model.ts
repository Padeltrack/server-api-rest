import mongoose, { Schema, Document } from 'mongoose';

export interface StudentCoachesModel extends Document {
  readonly _id: string;
  studentId: string;
  coachId: string;
}

const StudentCoachesMongoSchema = new Schema<StudentCoachesModel>(
  {
    _id: { type: String, required: true },
    studentId: { type: String, required: true, ref: 'User' },
    coachId: { type: String, required: true, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'student_coaches',
  },
);

export const StudentCoachesMongoModel = mongoose.model<StudentCoachesModel>(
  'StudentCoaches',
  StudentCoachesMongoSchema,
);
