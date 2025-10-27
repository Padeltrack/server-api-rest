import { OnboardingQuestionMongoModel } from './onboarding.model';
import { UserOnboardingAnswerModel } from '../user/user.model';
import { OnboardingQuestionModel } from './onboarding.model';

export const validateOnboardingAnswers = async (options: {
  onboarding: UserOnboardingAnswerModel[];
  language: keyof OnboardingQuestionModel["translate"];
}): Promise<{ valid: boolean; errors?: string[] }> => {
  const { onboarding, language } = options;
  const errors: string[] = [];

  const questionsCount = await OnboardingQuestionMongoModel.countDocuments();

  if (questionsCount !== onboarding.length) {
    errors.push(`El número de preguntas debe ser igual al de la onboarding`);
    return {
      valid: false,
      errors,
    };
  }

  for (const item of onboarding) {
    const { questionId, answer } = item;

    if (!questionId) {
      errors.push(`ID de pregunta inválido: ${questionId}`);
      continue;
    }

    const question = await OnboardingQuestionMongoModel.findById(questionId);

    if (!question) {
      errors.push(`Pregunta no encontrada para ID: ${questionId}`);
      continue;
    }

    if (!question.translate[language].options.includes(answer)) {
      errors.push(
        `Respuesta inválida para la pregunta "${question.translate[language].question}". Opción recibida: "${answer}"`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    ...(errors.length > 0 ? { errors } : {}),
  };
};
