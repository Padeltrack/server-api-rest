import { z } from 'zod';

export const createMatchSchemaZod = z.object({
  playersId: z
    .array(z.string(), { required_error: 'matches.validation.playersRequired' })
    .min(2, { message: 'matches.validation.twoPlayersRequired' })
    .max(2, { message: 'matches.validation.twoPlayersRequired' }),
  playersName: z
    .array(z.string(), { required_error: 'matches.validation.playersNameRequired' })
    .min(2, { message: 'matches.validation.twoPlayersRequired' })
    .max(2, { message: 'matches.validation.twoPlayersRequired' }),
  screenshots: z
    .array(
      z.object({
        name: z
          .string({ required_error: 'matches.validation.screenshotNameRequired' })
          .min(1, { message: 'matches.validation.screenshotNameRequired' }),
        image: z
          .string({ required_error: 'matches.validation.screenshotImageRequired' })
          .min(1, { message: 'matches.validation.screenshotImageRequired' }),
      }),
    )
    .optional(),
  winners: z
    .array(
      z.object({
        zone: z.string(),
        shootType: z.string(),
        variantType: z.string().optional(),
        comment: z.string().optional(),
      }),
    )
    .optional(),
  err: z
    .array(
      z.object({
        error: z.string(),
        shootTypeError: z.string(),
        typeError: z.string(),
        causeError: z.string(),
        comment: z.string().optional(),
      }),
    )
    .optional(),
  totalTime: z
    .string({ required_error: 'matches.validation.totalTimeRequired' })
    .min(1, { message: 'matches.validation.totalTimeRequired' }),
  place: z
    .string({ required_error: 'matches.validation.placeRequired' })
    .min(1, { message: 'matches.validation.placeRequired' }),
  tournamentName: z
    .string({ required_error: 'matches.validation.tournamentNameRequired' })
    .min(1, { message: 'matches.validation.tournamentNameRequired' }),
  finalPoints: z.array(
    z.array(
      z
        .number({ required_error: 'matches.validation.finalPointsRequired' })
        .min(0, { message: 'matches.validation.finalPointsRequired' }),
    ),
    { required_error: 'matches.validation.finalPointsRequired' },
  ),
  tiebreaks: z.array(
    z.array(
      z
        .number({ required_error: 'matches.validation.tiebreaksRequired' })
        .min(0, { message: 'matches.validation.tiebreaksRequired' }),
    ),
    { required_error: 'matches.validation.tiebreaksRequired' },
  ),
  superTiebreaks: z.array(
    z.array(
      z
        .number({ required_error: 'matches.validation.superTiebreaksRequired' })
        .min(0, { message: 'matches.validation.superTiebreaksRequired' }),
    ),
    { required_error: 'matches.validation.superTiebreaksRequired' },
  ),
  setsNumber: z
    .number({ required_error: 'matches.validation.setsNumberRequired' })
    .min(1, { message: 'matches.validation.setsNumberRequired' }),
  notes: z.string().optional(),
  isAD: z.boolean().optional(),
});

export type CreateMatchDto = z.infer<typeof createMatchSchemaZod>;
