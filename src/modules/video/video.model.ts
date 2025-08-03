import mongoose, { Schema, Document } from 'mongoose';

export interface VideoModel extends Document {
  readonly _id: string;
  idVideoVimeo: string;
}

const VideoMongoSchema = new Schema<VideoModel>(
  {
    _id: { type: String, required: true },
    idVideoVimeo: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'videos',
  },
);

export const VideoMongoModel = mongoose.model<VideoModel>('Video', VideoMongoSchema);
