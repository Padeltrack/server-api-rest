import { z } from 'zod';

export const CreateVideoSchemaZod = z.object({
  nombre: z
    .string({ required_error: 'videos.validation.nameRequired' })
    .min(1, { message: 'videos.validation.nameRequired' }),
  descripcion: z
    .string({ required_error: 'videos.validation.descriptionRequired' })
    .min(1, { message: 'videos.validation.descriptionRequired' }),
  nivelFisico: z.string({ required_error: 'videos.validation.physicalLevelRequired' }).optional(),
  objetivos: z.string({ required_error: 'videos.validation.objectivesRequired' }).optional(),
  momentoDeUso: z.string({ required_error: 'videos.validation.usageTimeRequired' }).optional(),
  contraccion: z.string({ required_error: 'videos.validation.contractionRequired' }).optional(),
  tipoEstimulo: z.string({ required_error: 'videos.validation.stimulusTypeRequired' }).optional(),
  zonaCuerpo: z.string({ required_error: 'videos.validation.bodyZoneRequired' }).optional(),
  musculos: z.string({ required_error: 'videos.validation.musclesRequired' }).optional(),
  sistemaControl: z
    .string({ required_error: 'videos.validation.controlSystemRequired' })
    .optional(),
  series: z.string({ required_error: 'videos.validation.seriesRequired' }).optional(),
  repeticiones: z.string({ required_error: 'videos.validation.repetitionsRequired' }).optional(),
  areaContenido: z.string({ required_error: 'videos.validation.contentAreaRequired' }).optional(),
  zonaPista: z.string({ required_error: 'videos.validation.courtZoneRequired' }).optional(),
  nivelJuego: z.string({ required_error: 'videos.validation.gameLevelRequired' }).optional(),
  espacio: z.string({ required_error: 'videos.validation.spaceRequired' }).optional(),
  material: z.string({ required_error: 'videos.validation.materialRequired' }).optional(),
  tipoGolpe: z.string({ required_error: 'videos.validation.strokeTypeRequired' }).optional(),
  observacion: z.string({ required_error: 'videos.validation.observationRequired' }).optional(),
  recomendaciones: z
    .string({ required_error: 'videos.validation.recommendationsRequired' })
    .optional(),
  plan: z.array(z.string(), { required_error: 'videos.validation.plansRequired' }),
  semanas: z.array(z.number(), { required_error: 'videos.validation.weeksRequired' }),
});

export const UpdateVideoSchemaZod = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  nivelFisico: z.string().optional(),
  objetivos: z.string().optional(),
  momentoDeUso: z.string().optional(),
  contraccion: z.string().optional(),
  tipoEstimulo: z.string().optional(),
  zonaCuerpo: z.string().optional(),
  musculos: z.string().optional(),
  sistemaControl: z.string().optional(),
  series: z.string().optional(),
  repeticiones: z.string().optional(),
  areaContenido: z.string().optional(),
  zonaPista: z.string().optional(),
  nivelJuego: z.string().optional(),
  espacio: z.string().optional(),
  material: z.string().optional(),
  tipoGolpe: z.string().optional(),
  observacion: z.string().optional(),
  recomendaciones: z.string().optional(),
  plan: z.array(z.string()).optional(),
  semanas: z.array(z.number()).optional(),
});

export type CreateVideoDTO = z.infer<typeof CreateVideoSchemaZod>;
export type UpdateVideoDTO = z.infer<typeof UpdateVideoSchemaZod>;
