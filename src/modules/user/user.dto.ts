import z from 'zod';
import { SelectCategoryUserModel, SelectGenderUserModel } from './user.model';

export const CreateAdminSchemaZod = z.object({
  gender: z.enum([SelectGenderUserModel.MAN, SelectGenderUserModel.WOMAN], {
    required_error: 'El sexo es requerido',
  }),
  email: z.string({ required_error: 'El email es requerido' }).email('El email es invalido'),
  displayName: z
    .string({ required_error: 'El nombre es requerido' })
    .min(1, 'El nombre es requerido'),
});

export const UpdateUserSchemaZod = z.object({
  birthdate: z.string().date().optional(),
  wherePlay: z.string().optional(),
  numberPhone: z.string().optional(),
  photo: z.string().optional(),
  displayName: z.string().optional(),
  category: z
    .enum([
      SelectCategoryUserModel.PRIMERA_CATEGORIA,
      SelectCategoryUserModel.SEGUNDA_CATEGORIA,
      SelectCategoryUserModel.TERCERA_CATEGORIA,
      SelectCategoryUserModel.CUARTA_CATEGORIA,
      SelectCategoryUserModel.QUINTA_CATEGORIA,
      SelectCategoryUserModel.SEXTA_CATEGORIA,
      SelectCategoryUserModel.SEPTIMA_CATEGORIA,
    ])
    .optional(),
  gameLevel: z.string().optional(),
  dominantHand: z.string().optional(),
  matchPosition: z.string().optional(),
  playStyle: z.string().optional(),
  weeklyPlayFrequency: z.number().optional(),
  injuryHistory: z.string().optional(),
  classPreferences: z.string().optional(),
  preferredClassSchedules: z.array(z.string()).optional(),
  desiredPhysicalTrainingType: z.string().optional(),
  preferredGameSchedules: z.array(z.string()).optional(),
  otherPadelTrackInterests: z.array(z.string()).optional(),
  preferredTournamentTypes: z.array(z.string()).optional(),
  preferredCompetitionDays: z.array(z.string()).optional(),
  competitionCategories: z.array(z.string()).optional(),
  mainCompetitionMotivation: z.string().optional(),
  gymPartnershipMatching: z.boolean().optional(),
  currentPhysicalCondition: z.string().optional(),
  physicalPriority: z.string().optional(),
  physicalTrainingAvailability: z.number().optional(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchemaZod>;
