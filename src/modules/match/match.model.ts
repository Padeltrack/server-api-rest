import { Schema, model, Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export enum SelectErrorTypeModel {
    technical = "Técnico",
    tactical = "Táctico",
    physical = "Físico"
}

export type ErrorTypeModel =
  (typeof SelectErrorTypeModel)[keyof typeof SelectErrorTypeModel];

export enum SelectMainErrorTypeModel {
    unforcedError = "Error no forzado",
    forcedError = "Error forzado"
}

export type MainErrorTypeModel =
  (typeof SelectMainErrorTypeModel)[keyof typeof SelectMainErrorTypeModel];

export enum SelectZoneModel {
    net = "Red",
    transition = "Transición",
    backcourt = "Fondo"
}

export type ZoneModel =
  (typeof SelectZoneModel)[keyof typeof SelectZoneModel];

export enum SelectShotTypeModel {
    volley = "Volea",
    smash = "Smash",
    block = "Bloqueo",
    dropShot = "Dejada"
}

export type ShotTypeModel =
  (typeof SelectShotTypeModel)[keyof typeof SelectShotTypeModel];

export interface WinnersMatchModel {
    readonly _id: string;
    zone: ZoneModel;
    shotType: ShotTypeModel;
    comment?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ErrMatchModel {
    readonly _id: string;
    mainErrorType: MainErrorTypeModel;
    zone: ZoneModel;
    shotType: ShotTypeModel;
    errorType: ErrorTypeModel;
    comment?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface MatchModel extends Document {
  readonly _id: string;
  winners: WinnersMatchModel[];
  err: ErrMatchModel[];
  totalTime: number;
  place: string;
  tournamentName: string;
  coachId: string;
  createdAt: Date;
  updatedAt: Date;
}

const WinnersMatchSchema = new Schema<WinnersMatchModel>({
  _id: { type: String, required: true, default: new ObjectId().toHexString() },
  zone: { type: String, required: true, enum: Object.values(SelectZoneModel) },
  shotType: { type: String, required: true, enum: Object.values(SelectShotTypeModel) },
  comment: { type: String, required: false }
}, {
    timestamps: true,
});

const ErrMatchSchema = new Schema<ErrMatchModel>({
  _id: { type: String, required: true, default: new ObjectId().toHexString() },
  mainErrorType: { type: String, required: true, enum: Object.values(SelectMainErrorTypeModel) },
  zone: { type: String, required: true, enum: Object.values(SelectZoneModel) },
  shotType: { type: String, required: true, enum: Object.values(SelectShotTypeModel) },
  errorType: { type: String, required: true, enum: Object.values(SelectErrorTypeModel) },
  comment: { type: String, required: false }
}, {
    timestamps: true
});

const MatchSchema = new Schema<MatchModel>({
  _id: { type: String, required: true },
  winners: { type: [WinnersMatchSchema], required: true },
  err: { type: [ErrMatchSchema], required: true },
  totalTime: { type: Number, required: true },
  place: { type: String, required: true },
  coachId: { type: String, required: true },
  tournamentName: { type: String, required: true },
}, {
  timestamps: true,
  collection: 'matches',
});

export const MatchMongoModel = model<MatchModel>(
  'Match',
  MatchSchema,
);
