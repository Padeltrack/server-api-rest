import { z } from 'zod';
import { SelectTypeAccountBankModel } from './bank.model';

export const BankRegisterSchemaZod = z.object({
  name: z.string().min(2).max(60),
  typeAccount: z.enum([
      SelectTypeAccountBankModel.SAVINGS,
      SelectTypeAccountBankModel.CHECKING,
    ]),
  numberAccount: z.string(),
  nameAccount: z.string().min(2).max(100),
  dniAccount: z.string().min(2).max(100),
});

export const BankUpdateSchemaZod = z.object({
  name: z.string().min(2).max(60).optional(),
  typeAccount: z.enum([
      SelectTypeAccountBankModel.SAVINGS,
      SelectTypeAccountBankModel.CHECKING,
    ]).optional(),
  numberAccount: z.string().optional(),
  nameAccount: z.string().min(2).max(100).optional(),
  dniAccount: z.string().min(2).max(100).optional(),
});

export type IBankRegisterDTO = z.infer<typeof BankRegisterSchemaZod>;
export type IBankUpdateDTO = z.infer<typeof BankUpdateSchemaZod>;
