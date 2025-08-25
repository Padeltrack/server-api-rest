import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { MatchMongoModel } from './match.model';
import { createMatchSchemaZod } from './match.zod';
import { SelectRoleModel, UserMongoModel } from '../user/user.model';
import { uploadImageScreenshotMatch } from './match.helper';

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
    const { playersId, playersName, screenshots } = dataMatch;

    if (!playersId.length || !playersName.length) {
      return res.status(400).json({
        message: 'Players are required',
      });
    }

    if (playersId.length !== 2 || playersName.length !== 2) {
      return res.status(400).json({
        message: 'Two players are required',
      });
    }

    const playersCount = await UserMongoModel.countDocuments({
      _id: { $in: playersId },
      role: SelectRoleModel.Student,
    });
    if (playersCount < 2) {
      return res.status(400).json({
        message: 'Players must be different',
      });
    }

    const screenshotsData = await Promise.all(
      screenshots.map(async itemBase64 => {
        const idScreenshot = new ObjectId().toHexString();
        const urlScreenshot = await uploadImageScreenshotMatch({
          imageBase64: itemBase64.image,
          idScreenshot,
        });

        return {
          _id: idScreenshot,
          name: itemBase64.name,
          image: urlScreenshot,
        };
      }),
    );

    const match = await MatchMongoModel.create({
      _id: new ObjectId().toHexString(),
      ...dataMatch,
      screenshots: screenshotsData,
      coachId: me._id,
    });

    return res.status(200).json({ match });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error creating match', error });
  }
};
