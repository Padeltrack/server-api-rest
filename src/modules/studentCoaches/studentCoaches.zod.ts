import { z } from 'zod';

export const studentCoachesAssignSchemaZod = z.object({
  coachId: z.string().min(1),
});

export type StudentCoachesAssignDto = z.infer<typeof studentCoachesAssignSchemaZod>;
