import { Request, Response } from 'express';
import { OnboardingQuestionMongoModel } from './onboarding.model';
import { updateOnboardingSchema } from './onboarding.dto';
import { ZodError } from 'zod';

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

export const updateQuestionOnboarding = async (req: Request, res: Response) => {
  req.logger = req.logger.child({
    service: 'onboarding',
    serviceHandler: 'updateQuestionsOnboarding',
  });
  req.logger.info({ status: 'start' });

  try {
    const { id } = req.params;
    const { question, options } = updateOnboardingSchema.parse(req.body);

    if (!id) {
      return res.status(400).json({
        message: 'Id is required'
      });
    }

    if (!options.length) {
      return res.status(400).json({
        message: 'Options is required'
      });
    }

    const questionUpdated = await OnboardingQuestionMongoModel.findByIdAndUpdate(id, { question, options }, { new: true });
    return res.status(200).json({ question: questionUpdated });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error updating questions onboarding', error });
  }
};

export const deleteQuestionOnboarding = async (req: Request, res: Response) => {
  req.logger = req.logger.child({
    service: 'onboarding',
    serviceHandler: 'deleteQuestionOnboarding',
  });
  req.logger.info({ status: 'start' });

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: 'Id is required'
      });
    }

    await OnboardingQuestionMongoModel.deleteOne({ _id: id });
    return res.status(200).json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching questions onboarding', error });
  }
};
