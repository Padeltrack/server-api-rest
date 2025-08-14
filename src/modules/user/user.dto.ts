import z from 'zod';

export const UpdateUserSchemaZod = z.object({
  birthdate: z.string().date().optional(),
  wherePlay: z.string().optional(),
  numberPhone: z.string().optional(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchemaZod>;
