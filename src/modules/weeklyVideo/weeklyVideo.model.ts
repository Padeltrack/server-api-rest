import { Schema, model, Document } from 'mongoose';

export interface ItemVideoWeekly extends Document {
  check: boolean;
  videoId: string;
}

export interface IWeeklyVideoModel extends Document {
  readonly _id: string;
  week: number;
  orderId: string;
  videos: ItemVideoWeekly[];
}

const ItemVideoWeeklySchema = new Schema<ItemVideoWeekly>(
  {
    check: { type: Boolean, required: true, default: false },
    videoId: { type: String, required: true },
  },
  {
    _id: false,
    timestamps: false,
  },
);

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
    videos: {
      type: [ItemVideoWeeklySchema],
      ref: 'Video',
      required: true,
      validate: {
        validator: function (arr: any[]) {
          return arr.length <= 10;
        },
        message: 'No puedes asignar más de 10 videos a una semana',
      },
    },
  },
  { timestamps: true },
);

export const WeeklyVideoMongoModel = model<IWeeklyVideoModel>('WeeklyVideos', weeklyVideosSchema);
