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
    const search = req.query?.search || '';

    if (search) {
      query.$or = [
        { tournamentName: { $regex: search, $options: 'i' } },
        { place: { $regex: search, $options: 'i' } },
        { playersName: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    if (me.role === SelectRoleModel.Coach) {
      query.coachId = me._id;
    }

    const count = await MatchMongoModel.countDocuments(query);
    const matches = await MatchMongoModel.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 1,
          tournamentName: 1,
          place: 1,
          totalTime: 1,
          createdAt: 1,
          updatedAt: 1,
          winnersCount: { $size: '$winners' },
          errorsCount: { $size: '$err' },
          screenshotsCount: { $size: '$screenshots' },
          playersId: 1,
          coachId: 1,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'playersId',
          foreignField: '_id',
          as: 'players',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'coachId',
          foreignField: '_id',
          as: 'coach',
        },
      },
      { $unwind: '$coach' },
      {
        $project: {
          _id: 1,
          tournamentName: 1,
          place: 1,
          totalTime: 1,
          createdAt: 1,
          updatedAt: 1,
          winnersCount: 1,
          errorsCount: 1,
          screenshotsCount: 1,
          'players._id': 1,
          'players.displayName': 1,
          'players.photo': 1,
          'coach._id': 1,
          'coach.displayName': 1,
          'coach.photo': 1,
        },
      },
    ]);

    return res.status(200).json({ 
      matches, 
      count,
      message: req.t('matches.list.loaded')
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('matches.list.error'), error });
  }
};

export const getMatch = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'match', serviceHandler: 'getMatch' });
  req.logger.info({ status: 'start' });

  try {
    const { id } = req.params;
    const me = req.user;

    const query: any = { _id: id };

    if (me.role === SelectRoleModel.Coach) {
      query.coachId = me._id;
    }

    const match = await MatchMongoModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'playersId',
          foreignField: '_id',
          as: 'players',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'coachId',
          foreignField: '_id',
          as: 'coach',
        },
      },
      { $unwind: { path: '$coach', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          tournamentName: 1,
          place: 1,
          totalTime: 1,
          createdAt: 1,
          updatedAt: 1,
          winners: 1,
          err: 1,
          screenshots: 1,
          finalPoints: 1,
          tiebreaks: 1,
          superTiebreaks: 1,
          setsNumber: 1,
          notes: 1,
          isAD: 1,
          playersName: 1,
          'players._id': 1,
          'players.displayName': 1,
          'players.photo': 1,
          'coach._id': 1,
          'coach.displayName': 1,
          'coach.photo': 1,
        },
      },
    ]);

    return res.status(200).json({ match: match?.[0] || {} });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('matches.detail.error'), error });
  }
};

export const createMatch = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'match', serviceHandler: 'createMatch' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const dataMatch = createMatchSchemaZod.parse(req.body);
    const { playersId, playersName, screenshots, finalPoints, superTiebreaks, tiebreaks } =
      dataMatch;

    if (!playersId.length || !playersName.length) {
      return res.status(400).json({
        message: req.t('matches.validation.playersRequired'),
      });
    }

    if (playersId.length !== 2 || playersName.length !== 2) {
      return res.status(400).json({
        message: req.t('matches.validation.twoPlayersRequired'),
      });
    }

    if (!finalPoints.length) {
      return res.status(400).json({
        message: req.t('matches.validation.finalPointsRequired'),
      });
    }

    if (!tiebreaks.length) {
      return res.status(400).json({
        message: req.t('matches.validation.tiebreaksRequired'),
      });
    }

    if (!superTiebreaks.length) {
      return res.status(400).json({
        message: req.t('matches.validation.superTiebreaksRequired'),
      });
    }

    const playersCount = await UserMongoModel.countDocuments({
      _id: { $in: playersId },
      role: SelectRoleModel.Student,
    });
    if (playersCount < 2) {
      return res.status(400).json({
        message: req.t('matches.validation.differentPlayers'),
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

    return res.status(200).json({ 
      match,
      message: req.t('matches.create.success')
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('matches.create.error'), error });
  }
};
