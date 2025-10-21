import { z } from 'zod';

export const AdsRegisterSchemaZod = z.object({
  imageBase64: z
    .string({ required_error: 'ads.validation.imageRequired' })
    .min(3, { message: 'ads.validation.imageInvalid' }),
  link: z.string().url({ message: 'validation.url' }).optional(),
  active: z.boolean().optional(),
});

export const AdsUpdateSchemaZod = z.object({
  imageBase64: z.string().min(3, { message: 'ads.validation.imageInvalid' }).optional(),
  link: z.string().url({ message: 'validation.url' }).optional(),
  active: z.boolean().optional(),
});

export type IAdsRegisterDTO = z.infer<typeof AdsRegisterSchemaZod>;
export type IAdsUpdateDTO = z.infer<typeof AdsUpdateSchemaZod>;
