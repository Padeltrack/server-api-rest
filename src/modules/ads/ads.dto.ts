import { z } from 'zod';

export const AdsRegisterSchemaZod = z.object({
  imageBase64: z.string().min(3),
  link: z.string().url().optional(),
  active: z.boolean().optional(),
});

export const AdsUpdateSchemaZod = z.object({
  imageBase64: z.string().min(3).optional(),
  link: z.string().url().optional(),
  active: z.boolean().optional(),
});

export type IAdsRegisterDTO = z.infer<typeof AdsRegisterSchemaZod>;
export type IAdsUpdateDTO = z.infer<typeof AdsUpdateSchemaZod>;
