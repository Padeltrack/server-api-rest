import { z } from 'zod';
import { SelectTypeAccountBankModel } from './bank.model';

export const BankRegisterSchemaZod = z.object({
  name: z
    .string({ required_error: 'bank.validation.bankNameRequired' })
    .min(2, { message: 'validation.minLength' })
    .max(60, { message: 'validation.maxLength' }),
  typeAccount: z.enum([SelectTypeAccountBankModel.SAVINGS, SelectTypeAccountBankModel.CHECKING], {
    required_error: 'bank.validation.accountTypeRequired',
  }),
  numberAccount: z.string({ required_error: 'bank.validation.accountNumberRequired' }),
  nameAccount: z
    .string({ required_error: 'validation.required' })
    .min(2, { message: 'validation.minLength' })
    .max(100, { message: 'validation.maxLength' }),
  dniAccount: z
    .string({ required_error: 'validation.required' })
    .min(2, { message: 'validation.minLength' })
    .max(100, { message: 'validation.maxLength' }),
});

export const BankUpdateSchemaZod = z.object({
  name: z
    .string()
    .min(2, { message: 'validation.minLength' })
    .max(60, { message: 'validation.maxLength' })
    .optional(),
  typeAccount: z
    .enum([SelectTypeAccountBankModel.SAVINGS, SelectTypeAccountBankModel.CHECKING])
    .optional(),
  numberAccount: z.string().optional(),
  nameAccount: z
    .string()
    .min(2, { message: 'validation.minLength' })
    .max(100, { message: 'validation.maxLength' })
    .optional(),
  dniAccount: z
    .string()
    .min(2, { message: 'validation.minLength' })
    .max(100, { message: 'validation.maxLength' })
    .optional(),
});

export type IBankRegisterDTO = z.infer<typeof BankRegisterSchemaZod>;
export type IBankUpdateDTO = z.infer<typeof BankUpdateSchemaZod>;
