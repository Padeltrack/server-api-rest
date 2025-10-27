import { Request, Response } from 'express';
import { OnboardingQuestionMongoModel } from './onboarding.model';
import { updateOnboardingSchema } from './onboarding.dto';
import { ZodError } from 'zod';
import { formatZodErrorResponse } from '../../shared/util/zod.util';
import { getRequestLanguage, transformTranslatedDocument } from '../../middleware/translation.middleware';

export const getQuestionsOnboarding = async (req: Request, res: Response) => {
  req.logger = req.logger.child({
    service: 'onboarding',
    serviceHandler: 'getQuestionsOnboarding',
  });
  req.logger.info({ status: 'start' });

  try {
    const questions = await OnboardingQuestionMongoModel.find().sort({ order: 1 }).lean();
    return res.status(200).json({
      questions,
      message: req.t('onboarding.questions.loaded'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('onboarding.questions.error'), error });
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
    const language = getRequestLanguage(req);

    if (!id) {
      return res.status(400).json({
        message: req.t('onboarding.validation.idRequired'),
      });
    }

    if (!options.length) {
      return res.status(400).json({
        message: req.t('onboarding.validation.optionsRequired'),
      });
    }

    const fields: any = {};
    fields[`translate.${language}`] = {
      question,
      options,
    };

    const questionUpdated = await OnboardingQuestionMongoModel.findByIdAndUpdate(
      id,
      fields,
      { new: true },
    );
    return res.status(200).json({
      question: transformTranslatedDocument(questionUpdated, language),
      message: req.t('onboarding.questions.updated'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(formatZodErrorResponse(error, req.t));
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('onboarding.questions.updateError'), error });
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
        message: req.t('onboarding.validation.idRequired'),
      });
    }

    await OnboardingQuestionMongoModel.deleteOne({ _id: id });
    return res.status(200).json({
      message: req.t('onboarding.questions.deleted'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('onboarding.questions.deleteError'), error });
  }
};
