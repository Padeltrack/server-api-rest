import { Request, Response } from 'express';
import { PlanMongoModel } from './plan.model';
import { createPlanSchema } from './plan.dto';

export const createPlan = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'plans', serviceHandler: 'createPlan' });
  req.logger.info({ status: 'start' });

  try {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const newPlan = await PlanMongoModel.create(parsed.data);
    return res.status(201).json(newPlan);
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllPlans = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'plans', serviceHandler: 'getAllPlans' });
  req.logger.info({ status: 'start' });

  try {
    const plans = await PlanMongoModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ plans });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching plans', error });
  }
};
