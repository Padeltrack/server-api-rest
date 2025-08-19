import { z } from 'zod';

export const CreateVideoSchemaZod = z.object({
  nombre: z.string({ required_error: 'El nombre es requerido' }).min(1, 'El nombre es requerido'),
  descripcion: z
    .string({ required_error: 'La descripción es requerida' })
    .min(1, 'La descripción es requerida'),
  nivelFisico: z
    .string({
      required_error: 'El nivel físico es requerido',
    })
    .optional(),
  objetivos: z
    .string({
      required_error: 'Los objetivos son requeridos',
    })
    .optional(),
  momentoDeUso: z
    .string({
      required_error: 'El momento de uso es requerido',
    })
    .optional(),
  contraccion: z
    .string({
      required_error: 'La contracción es requerida',
    })
    .optional(),
  tipoEstimulo: z
    .string({
      required_error: 'El tipo de estímulo es requerido',
    })
    .optional(),
  zonaCuerpo: z
    .string({
      required_error: 'La zona del cuerpo es requerida',
    })
    .optional(),
  musculos: z
    .string({
      required_error: 'Los músculos son requeridos',
    })
    .optional(),
  sistemaControl: z
    .string({
      required_error: 'El sistema de control es requerido',
    })
    .optional(),
  series: z
    .string({
      required_error: 'Las series son requeridas',
    })
    .optional(),
  repeticiones: z
    .string({
      required_error: 'Las repeticiones son requeridas',
    })
    .optional(),
  areaContenido: z
    .string({
      required_error: 'El área de contenido es requerida',
    })
    .optional(),
  zonaPista: z
    .string({
      required_error: 'La zona es requerida',
    })
    .optional(),
  nivelJuego: z
    .string({
      required_error: 'El nivel de juego es requerido',
    })
    .optional(),
  espacio: z
    .string({
      required_error: 'El espacio es requerido',
    })
    .optional(),
  material: z
    .string({
      required_error: 'El material es requerido',
    })
    .optional(),
  tipoGolpe: z
    .string({
      required_error: 'El formato es requerido',
    })
    .optional(),
  observacion: z
    .string({
      required_error: 'La observación es requerida',
    })
    .optional(),
  recomendaciones: z
    .string({
      required_error: 'Las recomendaciones son requeridas',
    })
    .optional(),
  plan: z.string({ required_error: 'Los planes son requeridos' }),
  semanas: z.string({ required_error: 'Las semanas son requeridas' }),
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
