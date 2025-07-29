import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  active: z.boolean().optional(),
});

export type CreatePlanDto = z.infer<typeof createPlanSchema>;
