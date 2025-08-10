import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().nonnegative(),
  active: z.boolean(),
  benefits: z.array(z.string()),
});

export const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
  benefits: z.array(z.string()).optional(),
});

export type CreatePlanDto = z.infer<typeof createPlanSchema>;
