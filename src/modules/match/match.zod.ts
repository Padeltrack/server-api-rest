import { z } from 'zod';
import { SelectErrorTypeModel, SelectMainErrorTypeModel, SelectShotTypeModel, SelectZoneModel } from './match.model';

export const createMatchSchemaZod = z.object({
  winners: z.array(z.object({
    zone: z.enum([
        SelectZoneModel.backcourt,
        SelectZoneModel.net,
        SelectZoneModel.transition
    ]),
    shotType: z.enum([
        SelectShotTypeModel.block,
        SelectShotTypeModel.dropShot,
        SelectShotTypeModel.smash,
        SelectShotTypeModel.volley
    ]),
    comment: z.string().optional()
  })).min(1),
  err: z.array(z.object({
    mainErrorType: z.enum([
        SelectMainErrorTypeModel.forcedError,
        SelectMainErrorTypeModel.unforcedError
    ]),
    zone: z.enum([
        SelectZoneModel.backcourt,
        SelectZoneModel.net,
        SelectZoneModel.transition
    ]),
    shotType: z.enum([
        SelectShotTypeModel.block,
        SelectShotTypeModel.dropShot,
        SelectShotTypeModel.smash,
        SelectShotTypeModel.volley
    ]),
    errorType: z.enum([
        SelectErrorTypeModel.physical,
        SelectErrorTypeModel.tactical,
        SelectErrorTypeModel.technical
    ]),
    comment: z.string().optional()
  })),
  totalTime: z.number({ required_error: 'El tiempo es requerido' }).min(0),
  place: z.string({ required_error: 'El lugar es requerido' }).min(1),
  tournamentName: z.string({ required_error: 'El nombre del torneo es requerido' }).min(1),
});

export type CreateMatchDto = z.infer<typeof createMatchSchemaZod>;
