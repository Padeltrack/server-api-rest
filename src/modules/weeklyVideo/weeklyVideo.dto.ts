import z from 'zod';

export const MarkCheckMeVideoSchemaZod = z.object({
  videoId: z.string({ required_error: 'El identificador del video es requerido' }).min(1),
});
