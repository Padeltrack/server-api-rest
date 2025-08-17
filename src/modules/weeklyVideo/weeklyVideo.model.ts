import { Schema, model, Document } from 'mongoose';

interface IWeeklyVideoModel extends Document {
  readonly _id: string;
  week: number;
  orderId: string;
  videos: string[];
}

const weeklyVideosSchema = new Schema<IWeeklyVideoModel>(
  {
    _id: { type: String, required: true },
    week: {
      type: Number,
      required: true,
      min: 1,
    },
    orderId: {
      type: String,
      ref: 'Order',
      required: true,
    },
    videos: [
      {
        type: String,
        ref: 'Video',
        validate: {
          validator: function (arr: any[]) {
            return arr.length > 10;
          },
          message: 'No puedes asignar más de 10 videos a una semana',
        },
      },
    ],
  },
  { timestamps: true },
);

export const WeeklyVideoMongoModel = model<IWeeklyVideoModel>('WeeklyVideos', weeklyVideosSchema);
