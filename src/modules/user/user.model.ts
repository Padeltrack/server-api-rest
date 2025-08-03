import mongoose, { Schema, Document } from 'mongoose';

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
  photo: string | null;
  role: RoleModel;
  verified: boolean;
  level: UserLevelModel | null;
  mfaSecret: string | null;
  onboarding: string | null;
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
      unique: true,
      default: null,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^\+?[1-9]\d{7,14}$/.test(v);
        },
        message: props => `${props.value} no es un número de teléfono válido`,
      },
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    photo: { type: String, required: false, default: null },
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
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

export const UserMongoModel = mongoose.model<UserModel>('User', UserMongoSchema);
