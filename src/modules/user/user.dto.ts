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
  countryOfOrigin: z.string().optional(),
  countryOfResidence: z.string().optional(),
  cityOfResidence: z.string().optional(),
  dominantHand: z.string().optional(),
  matchPosition: z.string().optional(),
  playStyle: z.string().optional(),
  injuryHistory: z.string().optional(),
  desiredPhysicalTrainingType: z.string().optional(),
  mainCompetitionMotivation: z.string().optional(),
  gymPartnershipMatching: z.boolean().optional(),
  physicalPriority: z.string().optional(),
  competitionGender: z.string().optional(),
  competitionCategory: z.string().optional(),
  frequencyClub: z.string().optional(),
  languagesSpoken: z.string().optional(),
  highestCertification: z.string().optional(),
  complementaryTraining: z.array(z.string()).optional(),
  studentsTrained: z.array(z.string()).optional(),
  workClub: z.string().optional(),
  yearsExperience: z.string().optional(),
  successStories: z.string().optional(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchemaZod>;
