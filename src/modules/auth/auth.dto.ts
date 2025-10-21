import { z } from 'zod';
import { SelectRoleModel, SelectGenderUserModel } from '../user/user.model';

export const GoogleRegisterSchemaZod = z.object({
  idToken: z
    .string({ required_error: 'auth.validation.tokenRequired' })
    .min(1, { message: 'auth.validation.tokenRequired' }),
  birthdate: z.string().optional(),
  gender: z.enum([SelectGenderUserModel.MAN, SelectGenderUserModel.WOMAN], {
    required_error: 'auth.validation.genderRequired',
  }),
  role: z.enum([SelectRoleModel.Student, SelectRoleModel.Coach], {
    required_error: 'auth.validation.roleRequired',
  }),
  onboarding: z.array(
    z.object({
      questionId: z
        .string({ required_error: 'auth.validation.questionRequired' })
        .min(1, { message: 'auth.validation.questionRequired' }),
      answer: z
        .string({ required_error: 'auth.validation.answerRequired' })
        .min(1, { message: 'auth.validation.answerRequired' }),
    }),
    { required_error: 'auth.validation.onboardingRequired' },
  ),
});

export const GoogleLoginSchemaZod = z.object({
  idToken: z
    .string({ required_error: 'auth.validation.tokenRequired' })
    .min(1, { message: 'auth.validation.tokenRequired' }),
});

export const verifyAdminMfaSchemaZod = z.object({
  code: z
    .string({ required_error: 'auth.validation.codeRequired' })
    .min(1, { message: 'auth.validation.codeRequired' }),
  idToken: z
    .string({ required_error: 'auth.validation.tokenRequired' })
    .min(1, { message: 'auth.validation.tokenRequired' }),
});

export type GoogleRegisterDTO = z.infer<typeof GoogleRegisterSchemaZod>;
export type GoogleLoginDTO = z.infer<typeof GoogleLoginSchemaZod>;
export type VerifyAdminMfaDTO = z.infer<typeof verifyAdminMfaSchemaZod>;
