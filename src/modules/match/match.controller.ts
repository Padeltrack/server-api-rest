import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { MatchMongoModel } from './match.model';
import { createMatchSchemaZod } from './match.zod';
import { SelectRoleModel } from '../user/user.model';

export const getMatches = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'match', serviceHandler: 'getMatches' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;

    const query: any = {};

    if (me.role === SelectRoleModel.Coach) {
      query.coachId = me._id;
    }

    const count = await MatchMongoModel.countDocuments(query);
    const matches = await MatchMongoModel.find(query).sort({ createdAt: -1 });

    return res.status(200).json({ matches, count });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching matches', error });
  }
};

export const createMatch = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'match', serviceHandler: 'createMatch' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const dataMatch = createMatchSchemaZod.parse(req.body);

    const match = await MatchMongoModel.create({
        _id: new ObjectId().toHexString(),
        ...dataMatch,
        coachId: me._id,
    });

    return res.status(201).json({ match });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error creating match', error });
  }
};
