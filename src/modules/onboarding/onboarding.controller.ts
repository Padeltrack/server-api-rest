import { Request, Response } from 'express';
import { OnboardingQuestionMongoModel } from './onboarding.model';

export const getQuestionsOnboarding = async (req: Request, res: Response) => {
  req.logger = req.logger.child({
    service: 'onboarding',
    serviceHandler: 'getQuestionsOnboarding',
  });
  req.logger.info({ status: 'start' });

  try {
    const questions = await OnboardingQuestionMongoModel.find().sort({ order: 1 });
    return res.status(200).json({ questions });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching questions onboarding', error });
  }
};
