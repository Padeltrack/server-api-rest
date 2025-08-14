import { Request, Response } from 'express';
import { WeeklyVideoMongoModel } from './weeklyVideo.model';

export const getWeeklyVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'weeklyVideo', serviceHandler: 'getWeeklyVideos' });
  req.logger.info({ status: 'start' });

  try {
    const order = req.order;
    const weeklyVideo = await WeeklyVideoMongoModel.findOne({ orderId: order._id, week: order.currentWeek });

    return res.status(200).json({ weeklyVideo });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching weeklyVideo' });
  }
};
