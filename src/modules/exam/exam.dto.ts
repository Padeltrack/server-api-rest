import { z } from 'zod';

export const ExamAnswerRegisterSchemaZod = z.object({
  questionnaireId: z
    .string({ required_error: 'El identificador de la pregunta es requerido' })
    .min(1, 'El identificador de la pregunta es requerido'),
  answerText: z.string().optional(),
});

export const ExamAnswerFinalizeSchemaZod = z.object({
  questionnaireId: z
    .string({ required_error: 'El identificador de la pregunta es requerido' })
    .min(1, 'El identificador de la pregunta es requerido'),
});

export const addQuestionnaireSchemaZod = z.object({
  title: z.string({ required_error: 'El titulo es requerido' }).min(1, 'El titulo es requerido'),
  description: z
    .string({ required_error: 'La descripción es requerida' })
    .min(1, 'La descripción es requerida'),
});

export const updateQuestionnaireSchemaZod = z.object({
  title: z.string({ required_error: 'El titulo es requerido' }).min(1, 'El titulo es requerido').optional(),
  description: z
    .string({ required_error: 'La descripción es requerida' })
    .min(1, 'La descripción es requerida')
    .optional(),
});

export const ExamGradeRegisterSchemaZod = z.object({
  examAnswerId: z
    .string({ required_error: 'El identificador del examen es requerido' })
    .min(1, 'El identificador del examen es requerido'),
  answers: z.array(
    z.object({
      questionnaireId: z.string({ required_error: 'El identificador de la pregunta es requerido' }),
      score: z.number({ required_error: 'El puntaje es requerido' }).min(0).max(10).positive(),
    }),
  ),
});

export const AssignExamToCoachSchemaZod = z.object({
  examAnswerId: z
    .string({ required_error: 'El identificador del examen es requerido' })
    .min(1, 'El identificador del examen es requerido'),
  coachId: z
    .string({ required_error: 'El identificador del coach es requerido' })
    .min(1, 'El identificador del coach es requerido'),
});

export type IExamAnswerRegisterDTO = z.infer<typeof ExamAnswerRegisterSchemaZod>;
export type IAddQuestionnaireDTO = z.infer<typeof addQuestionnaireSchemaZod>;
export type IExamGradeRegisterDTO = z.infer<typeof ExamGradeRegisterSchemaZod>;
export type IAssignExamToCoachDTO = z.infer<typeof AssignExamToCoachSchemaZod>;
