import { Request, Response } from 'express';
import { PlanMongoModel } from './plan.model';
import { createPlanSchema, updatePlanSchema } from './plan.dto';
import { ZodError } from 'zod';
import { HOST_ADMINS } from '../../shared/util/url.util';

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
    return res.status(200).json({ plans });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching plans', error });
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
    return res.status(200).json({ plans });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching plans', error });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'plans', serviceHandler: 'createPlan' });
  req.logger.info({ status: 'start' });

  try {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const newPlan = await PlanMongoModel.create(parsed.data);
    return res.status(201).json({ plan: newPlan });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Server error', error });
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
        message: 'Plan id is required',
      });
    }

    const plan = await PlanMongoModel.findOneAndUpdate({ _id: id }, fields, { new: true });
    return res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Server error', error });
  }
};
