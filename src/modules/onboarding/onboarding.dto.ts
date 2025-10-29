import { z } from 'zod';

export const updateOnboardingSchema = z.object({
  question: z
    .string({ required_error: 'onboarding.validation.questionRequired' })
    .min(1, 'onboarding.validation.questionRequired'),
  options: z.array(
    z.string({ required_error: 'onboarding.validation.answerRequired' }).min(1, 'onboarding.validation.answerRequired'),
  ),
});

export type UpdateOnboardingDto = z.infer<typeof updateOnboardingSchema>;
