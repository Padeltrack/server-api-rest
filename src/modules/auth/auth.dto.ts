import { z } from 'zod';
import { SelectRoleModel, SelectGenderUserModel } from '../user/user.model';

export const GoogleRegisterSchemaZod = z.object({
  idToken: z.string({ required_error: 'El Token es requerido' }).min(1, 'El Token es requerido'),
  birthdate: z.string().optional(),
  gender: z.enum([SelectGenderUserModel.MAN, SelectGenderUserModel.WOMAN], {
    required_error: 'El sexo es requerido',
  }),
  role: z.enum([SelectRoleModel.Student, SelectRoleModel.Coach], {
    required_error: 'El rol es requerido',
  }),
  onboarding: z.array(
    z.object({
      questionId: z
        .string({ required_error: 'La pregunta es requerida' })
        .min(1, 'La pregunta es requerida'),
      answer: z
        .string({ required_error: 'La respuesta es requerida' })
        .min(1, 'La respuesta es requerida'),
    }),
    { required_error: 'El onboarding es requerido' },
  ),
});

export const GoogleLoginSchemaZod = z.object({
  idToken: z.string({ required_error: 'El Token es requerido' }).min(1, 'El Token es requerido'),
});

export const verifyAdminMfaSchemaZod = z.object({
  code: z
    .string({ required_error: 'El código de verificación es requerido' })
    .min(1, 'El código de verificación es requerido'),
  idToken: z.string({ required_error: 'El Token es requerido' }).min(1, 'El Token es requerido'),
});

export type GoogleRegisterDTO = z.infer<typeof GoogleRegisterSchemaZod>;
export type GoogleLoginDTO = z.infer<typeof GoogleLoginSchemaZod>;
export type VerifyAdminMfaDTO = z.infer<typeof verifyAdminMfaSchemaZod>;
