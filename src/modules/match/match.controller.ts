import { Request, Response } from 'express';
import { MatchMongoModel } from './match.model';

export const getMatches = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'match', serviceHandler: 'getQuestionnaireExam' });
  req.logger.info({ status: 'start' });

  try {
    const count = await MatchMongoModel.countDocuments();
    const matches = await MatchMongoModel.find().sort({ createdAt: -1 });

    return res.status(200).json({ matches, count });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching matches', error });
  }
};
