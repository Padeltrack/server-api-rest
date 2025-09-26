import mongoose, { Schema, Document } from 'mongoose';
import { AVATAR_DEFAULT } from './user.constant';

export const SelectRoleModel = {
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  Student: 'Student',
  Coach: 'Coach',
} as const;

export type RoleModel = (typeof SelectRoleModel)[keyof typeof SelectRoleModel];

export const SelectUserLevelModel = {
  Principiante: 'Principiante',
  Intermedio: 'Intermedio',
  Avanzado: 'Avanzado',
} as const;

export type UserLevelModel = (typeof SelectUserLevelModel)[keyof typeof SelectUserLevelModel];

export const SelectGenderUserModel = {
  MAN: 'Man',
  WOMAN: 'Woman',
} as const;

export type GenderUserModel = (typeof SelectGenderUserModel)[keyof typeof SelectGenderUserModel];

export const SelectCategoryUserModel = {
  PRIMERA_CATEGORIA: 'Primera categoría',
  SEGUNDA_CATEGORIA: 'Segunda categoría',
  TERCERA_CATEGORIA: 'Tercera categoría',
  CUARTA_CATEGORIA: 'Cuarta categoría',
  QUINTA_CATEGORIA: 'Quinta categoría',
  SEXTA_CATEGORIA: 'Sexta categoría',
  SEPTIMA_CATEGORIA: 'Séptima categoría',
} as const;

export type CategoryUserModel =
  (typeof SelectCategoryUserModel)[keyof typeof SelectCategoryUserModel];

export interface UserOnboardingAnswerModel {
  questionId: string;
  answer: string;
}
export interface UserOnboardingModel {
  answers: UserOnboardingAnswerModel[];
  completedAt: Date;
}

export interface UserModel extends Document {
  readonly _id: string;
  displayName: string;
  numberPhone: string;
  gender: GenderUserModel;
  userName: string;
  birthdate: Date;
  wherePlay: string;
  email: string;
  photo: string;
  role: RoleModel;
  verified?: boolean;
  worked?: boolean;
  level: UserLevelModel | null;
  category: CategoryUserModel | null;
  mfaSecret?: string | null;
  onboarding: UserOnboardingModel | null;
  countryOfOrigin?: string;
  countryOfResidence?: string;
  cityOfResidence?: string;
  frequencyClub?: string;
  dominantHand?: string;
  matchPosition?: string;
  playStyle?: string;
  injuryHistory?: string;
  desiredPhysicalTrainingType?: string[];
  competitionGender?: string;
  competitionCategory?: string;
  // weeklyPlayFrequency?: number;
  // classPreferences?: string;
  // preferredClassSchedules?: string[];
  // preferredGameSchedules?: string[];
  // otherPadelTrackInterests?: string[];
  // preferredTournamentTypes?: string[];
  // preferredCompetitionDays?: string[];
  // competitionCategories?: string[];
  // currentPhysicalCondition?: string;
  // physicalTrainingAvailability?: number;
  mainCompetitionMotivation?: string;
  gymPartnershipMatching?: boolean;
  physicalPriority?: string;
  languagesSpoken?: string;
  highestCertification?: string;
  complementaryTraining?: string[];
  studentsTrained?: string[];
  workClub?: string;
  yearsExperience?: string;
  successStories?: string;
}

const UserOnboardingSchema = new Schema(
  {
    answers: [
      {
        _id: false,
        questionId: {
          type: String,
          required: true,
          ref: 'OnboardingQuestion',
        },
        answer: { type: String, required: true },
      },
    ],
    completedAt: { type: Date, default: Date.now },
  },
  {
    _id: false,
  },
);

const UserMongoSchema = new Schema<UserModel>(
  {
    _id: { type: String, required: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    numberPhone: {
      type: String,
      required: false,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    photo: { type: String, required: false, default: AVATAR_DEFAULT },
    birthdate: { type: Date, required: false, default: null },
    wherePlay: { type: String, required: false, default: null },
    gender: {
      type: String,
      required: true,
      enum: Object.values(SelectGenderUserModel),
      default: SelectGenderUserModel.MAN,
    },
    level: {
      type: String,
      required: false,
      enum: Object.values(SelectUserLevelModel),
      default: null,
    },
    verified: {
      type: Boolean,
      required: false,
    },
    worked: {
      type: Boolean,
      required: false,
    },
    category: {
      type: String,
      required: false,
      enum: Object.values(SelectCategoryUserModel),
      default: null,
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(SelectRoleModel),
      default: SelectRoleModel.Student,
    },
    mfaSecret: {
      type: String,
      required: false,
    },
    onboarding: { type: UserOnboardingSchema, required: false, default: null },
    countryOfOrigin: { type: String },
    countryOfResidence: { type: String },
    cityOfResidence: { type: String },
    frequencyClub: { type: String },
    dominantHand: { type: String },
    matchPosition: { type: String },
    playStyle: { type: String },
    competitionGender: { type: String },
    competitionCategory: { type: String },
    desiredPhysicalTrainingType: [{ type: String }],
    injuryHistory: { type: String },
    // weeklyPlayFrequency: { type: Number },
    // classPreferences: { type: String },
    // preferredClassSchedules: [{ type: String }],
    // preferredGameSchedules: [{ type: String }],
    // otherPadelTrackInterests: [{ type: String }],
    // preferredTournamentTypes: [{ type: String }],
    // preferredCompetitionDays: [{ type: String }],
    // competitionCategories: [{ type: String }],
    // currentPhysicalCondition: { type: String },
    // physicalTrainingAvailability: { type: Number },
    mainCompetitionMotivation: { type: String },
    gymPartnershipMatching: { type: Boolean },
    physicalPriority: { type: String },
    languagesSpoken: { type: String },
    highestCertification: { type: String },
    complementaryTraining: [{ type: String }],
    studentsTrained: [{ type: String }],
    workClub: { type: String },
    yearsExperience: { type: String },
    successStories: { type: String },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

export const UserMongoModel = mongoose.model<UserModel>('User', UserMongoSchema);
