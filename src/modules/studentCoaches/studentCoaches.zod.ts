import { z } from 'zod';

export const studentCoachesAssignSchemaZod = z.object({
  coachId: z
    .string({ required_error: 'coaches.validation.coachIdRequired' })
    .min(1, { message: 'coaches.validation.coachIdRequired' }),
});

export type StudentCoachesAssignDto = z.infer<typeof studentCoachesAssignSchemaZod>;
