import z from 'zod';
import { SelectGenderUserModel } from './user.model';

export const UpdateUserSchemaZod = z.object({
  birthdate: z.date().optional(),
  wherePlay: z.string().optional(),
  gender: z.enum([SelectGenderUserModel.MAN, SelectGenderUserModel.WOMAN]).optional(),
  numberPhone: z.string().optional(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchemaZod>;
