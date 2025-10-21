import z from 'zod';

export const MarkCheckMeVideoSchemaZod = z.object({
  videoId: z
    .string({ required_error: 'weeklyVideo.validation.videoIdRequired' })
    .min(1, { message: 'weeklyVideo.validation.videoIdRequired' }),
});
