import { z } from 'zod';

export const ExamAnswerRegisterSchemaZod = z.object({
  questionnaireId: z
    .string({ required_error: 'El identificador de la pregunta es requerido' })
    .min(1, 'El identificador de la pregunta es requerido'),
  answerText: z.string().optional(),
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

export type IExamAnswerRegisterDTO = z.infer<typeof ExamAnswerRegisterSchemaZod>;
export type IExamGradeRegisterDTO = z.infer<typeof ExamGradeRegisterSchemaZod>;
