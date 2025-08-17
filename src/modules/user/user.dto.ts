import z from 'zod';
import { SelectCategoryUserModel } from './user.model';

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
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchemaZod>;
