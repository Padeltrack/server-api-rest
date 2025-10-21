import { Request, Response } from 'express';
import { PlanMongoModel } from './plan.model';
import { createPlanSchema, updatePlanSchema } from './plan.dto';
import { ZodError } from 'zod';
import { HOST_ADMINS } from '../../shared/util/url.util';
import { formatZodErrorResponse } from '../../shared/util/zod.util';

export const getPlans = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'plans', serviceHandler: 'getPlans' });
  req.logger.info({ status: 'start' });

  try {
    const query: any = { isCoach: false };
    const origin = req.headers['origin'] || '';

    if (!HOST_ADMINS.includes(origin)) {
      query['active'] = true;
    }

    const plans = await PlanMongoModel.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      plans,
      message: req.t('plans.list.loaded'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({
      message: req.t('errors.serverError'),
      error,
    });
  }
};

export const getCoachPlans = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'plans', serviceHandler: 'getCoachPlans' });
  req.logger.info({ status: 'start' });

  try {
    const query: any = { isCoach: true };
    const origin = req.headers['origin'] || '';

    if (!HOST_ADMINS.includes(origin)) {
      query['active'] = true;
    }

    const plans = await PlanMongoModel.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      plans,
      message: req.t('plans.list.loaded'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({
      message: req.t('errors.serverError'),
      error,
    });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'plans', serviceHandler: 'createPlan' });
  req.logger.info({ status: 'start' });

  try {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: req.t('errors.badRequest'),
        errors: parsed.error.flatten(),
      });
    }

    const newPlan = await PlanMongoModel.create(parsed.data);
    return res.status(201).json({
      plan: newPlan,
      message: req.t('plans.create.success'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({
      message: req.t('errors.serverError'),
      error,
    });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'plans', serviceHandler: 'updatePlan' });
  req.logger.info({ status: 'start' });

  try {
    const { id } = req.params;
    const { name, description, price, active, benefits } = updatePlanSchema.parse(req.body);
    const fields: any = {};

    if (name) fields['name'] = name;
    if (description) fields['description'] = description;
    if (typeof price === 'number') fields['price'] = price;
    if (typeof active === 'boolean') fields['active'] = active;
    if (Array.isArray(benefits)) fields['benefits'] = benefits;

    if (!id) {
      return res.status(400).json({
        message: req.t('errors.badRequest'),
      });
    }

    const plan = await PlanMongoModel.findOneAndUpdate({ _id: id }, fields, { new: true });

    if (!plan) {
      return res.status(404).json({
        message: req.t('plans.detail.notFound'),
      });
    }

    return res.status(200).json({
      plan,
      message: req.t('plans.update.success'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(formatZodErrorResponse(error, req.t));
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({
      message: req.t('errors.serverError'),
      error,
    });
  }
};
