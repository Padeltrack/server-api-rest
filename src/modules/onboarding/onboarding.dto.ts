import { z } from 'zod';

export const updateOnboardingSchema = z.object({
  question: z
    .string({ required_error: 'La pregunta es requerida' })
    .min(1, 'La pregunta es requerida'),
  options: z.array(
    z.string({ required_error: 'La respuesta es requerida' }).min(1, 'La respuesta es requerida'),
  ),
});

export type UpdateOnboardingDto = z.infer<typeof updateOnboardingSchema>;
