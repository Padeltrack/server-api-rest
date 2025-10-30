import { Schema, model, Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export interface WinnersMatchModel {
  readonly _id: string;
  zone: string;
  shootType: string;
  variantType?: string | null;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrMatchModel {
  readonly _id: string;
  error: string;
  shootTypeError: string;
  typeError: string;
  causeError: string;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreenshotsMatchModel {
  readonly _id: string;
  image: string;
  name: string;
}

export interface MatchModel extends Document {
  readonly _id: string;
  playersId: string[];
  playersName: string[];
  screenshots: ScreenshotsMatchModel[];
  winners: WinnersMatchModel[];
  err: ErrMatchModel[];
  totalTime: string;
  place: string;
  tournamentName: string;
  coachId: string;
  finalPoints: number[][];
  tiebreaks: number[][];
  superTiebreaks: number[][];
  setsNumber: number;
  notes?: string | null;
  isAD: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WinnersMatchSchema = new Schema<WinnersMatchModel>(
  {
    _id: { type: String, required: true, default: new ObjectId().toHexString() },
    zone: { type: String, required: true },
    shootType: { type: String, required: true },
    variantType: { type: String, required: false },
    comment: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

const ErrMatchSchema = new Schema<ErrMatchModel>(
  {
    _id: { type: String, required: true, default: new ObjectId().toHexString() },
    error: { type: String, required: true },
    shootTypeError: { type: String, required: true },
    typeError: { type: String, required: true },
    causeError: { type: String, required: true },
    comment: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

const ScreenshotsSchema = new Schema(
  {
    _id: { type: String, required: true, default: new ObjectId().toHexString() },
    name: { type: String, required: true },
    image: { type: String, required: true },
  },
  {
    timestamps: false,
  },
);

const MatchSchema = new Schema<MatchModel>(
  {
    _id: { type: String, required: true },
    playersId: { type: [String], required: true },
    playersName: { type: [String], required: true },
    screenshots: { type: [ScreenshotsSchema], required: true },
    winners: { type: [WinnersMatchSchema], required: false, default: [] },
    err: { type: [ErrMatchSchema], required: false, default: [] },
    totalTime: { type: String, required: true },
    place: { type: String, required: true },
    coachId: { type: String, required: true },
    finalPoints: { type: [[Number]], required: true },
    tiebreaks: { type: [[Number]], required: true },
    superTiebreaks: { type: [[Number]], required: true },
    setsNumber: { type: Number, required: true },
    notes: { type: String, required: false },
    isAD: { type: Boolean, required: true },
    tournamentName: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'matches',
  },
);

export const MatchMongoModel = model<MatchModel>('Match', MatchSchema);
