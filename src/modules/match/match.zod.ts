import { z } from 'zod';
import {
  SelectErrorTypeModel,
  SelectMainErrorTypeModel,
  SelectShotTypeModel,
  SelectZoneModel,
} from './match.model';

export const createMatchSchemaZod = z.object({
  playersId: z.array(z.string()).min(2),
  playersName: z.array(z.string()).min(2),
  screenshots: z
    .array(
      z.object({
        name: z.string().min(1),
        image: z.string().min(1),
      }),
    )
    .min(1),
  winners: z
    .array(
      z.object({
        zone: z.enum([SelectZoneModel.backcourt, SelectZoneModel.net, SelectZoneModel.transition]),
        shotType: z.enum([
          SelectShotTypeModel.block,
          SelectShotTypeModel.dropShot,
          SelectShotTypeModel.smash,
          SelectShotTypeModel.volley,
        ]),
        comment: z.string().optional(),
      }),
    )
    .min(1),
  err: z.array(
    z.object({
      mainErrorType: z.enum([
        SelectMainErrorTypeModel.forcedError,
        SelectMainErrorTypeModel.unforcedError,
      ]),
      zone: z.enum([SelectZoneModel.backcourt, SelectZoneModel.net, SelectZoneModel.transition]),
      shotType: z.enum([
        SelectShotTypeModel.block,
        SelectShotTypeModel.dropShot,
        SelectShotTypeModel.smash,
        SelectShotTypeModel.volley,
      ]),
      errorType: z.enum([
        SelectErrorTypeModel.physical,
        SelectErrorTypeModel.tactical,
        SelectErrorTypeModel.technical,
      ]),
      comment: z.string().optional(),
    }),
  ),
  totalTime: z.string({ required_error: 'El tiempo es requerido' }),
  place: z.string({ required_error: 'El lugar es requerido' }).min(1),
  tournamentName: z.string({ required_error: 'El nombre del torneo es requerido' }).min(1),
  finalPoints: z.array(z.array(z.number({ required_error: 'El valor de punto final es requerido' }).min(0))),
  tiebreaks: z.array(z.array(z.number({ required_error: 'El valor de tie breaks es requerido' }).min(0))),
  superTiebreaks: z.array(z.array(z.number({ required_error: 'El valor de super tie breaks es requerido' }).min(0))),
  setsNumber: z.number({ required_error: 'El numero de sets es requerido' }),
  notes: z.strin().optional();
});

export type CreateMatchDto = z.infer<typeof createMatchSchemaZod>;
