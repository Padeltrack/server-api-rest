import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z
    .string({ required_error: 'plans.validation.nameRequired' })
    .min(1, { message: 'plans.validation.nameRequired' }),
  description: z.string({ required_error: 'validation.required' }),
  price: z
    .number({ required_error: 'plans.validation.priceRequired' })
    .nonnegative({ message: 'plans.validation.priceInvalid' }),
  active: z.boolean({ required_error: 'validation.required' }),
  benefits: z.array(z.string()),
});

export const updatePlanSchema = z.object({
  name: z.string().min(1, { message: 'plans.validation.nameRequired' }).optional(),
  description: z.string().optional(),
  price: z.number().nonnegative({ message: 'plans.validation.priceInvalid' }).optional(),
  active: z.boolean().optional(),
  benefits: z.array(z.string()).optional(),
});

export type CreatePlanDto = z.infer<typeof createPlanSchema>;
