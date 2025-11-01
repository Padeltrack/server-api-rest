import { z } from 'zod';

export const ExamAnswerRegisterSchemaZod = z.object({
  questionnaireId: z
    .string({ required_error: 'exams.validation.questionRequired' })
    .min(1, { message: 'exams.validation.questionRequired' }),
  answerText: z.string().optional(),
});

export const ExamAnswerFinalizeSchemaZod = z.object({
  questionnaireId: z
    .string({ required_error: 'exams.validation.questionRequired' })
    .min(1, { message: 'exams.validation.questionRequired' }),
});

export const addQuestionnaireSchemaZod = z.object({
  title: z
    .string({ required_error: 'exams.validation.titleRequired' })
    .min(1, { message: 'exams.validation.titleRequired' }),
  description: z
    .string({ required_error: 'exams.validation.descriptionRequired' })
    .min(1, { message: 'exams.validation.descriptionRequired' }),
});

export const updateQuestionnaireSchemaZod = z.object({
  title: z
    .string({ required_error: 'exams.validation.titleRequired' })
    .min(1, { message: 'exams.validation.titleRequired' })
    .optional(),
  description: z
    .string({ required_error: 'exams.validation.descriptionRequired' })
    .min(1, { message: 'exams.validation.descriptionRequired' })
    .optional(),
});

export const ExamGradeRegisterSchemaZod = z.object({
  examAnswerId: z
    .string({ required_error: 'exams.validation.examIdRequired' })
    .min(1, 'exams.validation.examIdRequired'),
  answers: z.array(
    z.object({
      questionnaireId: z.string({ required_error: 'exams.validation.questionIdRequired' }),
      score: z
        .number({ required_error: 'exams.validation.scoreRequired' })
        .min(0)
        .max(10)
        .positive(),
    }),
  ),
});

export const AssignExamToCoachSchemaZod = z.object({
  examAnswerId: z
    .string({ required_error: 'exams.validation.examIdRequired' })
    .min(1, 'exams.validation.examIdRequired'),
  coachId: z
    .string({ required_error: 'exams.validation.coachIdRequired' })
    .min(1, 'exams.validation.coachIdRequired'),
});

export type IExamAnswerRegisterDTO = z.infer<typeof ExamAnswerRegisterSchemaZod>;
export type IAddQuestionnaireDTO = z.infer<typeof addQuestionnaireSchemaZod>;
export type IExamGradeRegisterDTO = z.infer<typeof ExamGradeRegisterSchemaZod>;
export type IAssignExamToCoachDTO = z.infer<typeof AssignExamToCoachSchemaZod>;
