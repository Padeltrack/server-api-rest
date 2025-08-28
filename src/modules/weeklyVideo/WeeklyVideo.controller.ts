import { Request, Response } from 'express';
import { ItemVideoWeekly, WeeklyVideoMongoModel } from './weeklyVideo.model';
import { VideoMongoModel } from '../video/video.model';
import { getUrlTokenExtractVimeoVideoById, getVimeoVideoById } from '../vimeo/vimeo.helper';
import { MarkCheckMeVideoSchemaZod } from './weeklyVideo.dto';

export const getWeeklyVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'weeklyVideo', serviceHandler: 'getWeeklyVideos' });
  req.logger.info({ status: 'start' });

  try {
    const order = {
      _id: '689b9ac93ebadb0a7f7e7b44',
      userId: '689caff9df566824b005d3c2',
      planId: 'plan_basic',
      status: 'Approved',
      paymentProof:
        'https://firebasestorage.googleapis.com/v0/b/padeltrack-485e3.firebasestorage.app/o/proof_of_payment%2F689b9ac93ebadb0a7f7e7b44.png?alt=media',
      createdAt: '2025-08-12T19:49:29.906Z',
      updatedAt: '2025-08-22T01:00:02.056Z',
      __v: 0,
      currentWeek: 2,
      lastProgressDate: '2025-08-22T01:00:02.054Z',
      isCoach: false,
      approvedOrderDate: '2025-08-18T18:06:09.699Z',
      orderNumber: 'ORDER000001',
    }; //req.order;

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    const weeklyVideo: any = await WeeklyVideoMongoModel.findOne({
      orderId: order._id,
      week: order.currentWeek,
    });

    if (!weeklyVideo) {
      return res.status(404).json({
        message: 'Weekly video not found',
      });
    }

    const weeklyVideoData = await Promise.all(
      weeklyVideo.videos.map(async (item: ItemVideoWeekly) => {
        const video = await VideoMongoModel.findOne({ _id: item.videoId }).lean();
        if (video) {
          const videoVimeo: any = await getVimeoVideoById({
            id: video.idVideoVimeo,
          });
          const { linkVideo, thumbnail } = getUrlTokenExtractVimeoVideoById({ videoVimeo });
          return {
            ...video,
            check: item?.check || false,
            thumbnail,
            linkVideo,
          };
        }

        return null;
      }),
    );

    weeklyVideo._doc.videos = weeklyVideoData.filter(video => video !== null);

    return res.status(200).json({ weeklyVideo });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching weeklyVideo' });
  }
};

export const markCheckMeVideo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'weeklyVideo', serviceHandler: 'markCheckMeVideo' });
  req.logger.info({ status: 'start' });

  try {
    const { videoId } = MarkCheckMeVideoSchemaZod.parse(req.body);
    const order = req.order;

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    const weeklyVideo: any = await WeeklyVideoMongoModel.findOne(
      {
        orderId: order._id,
        week: order.currentWeek,
        'videos.videoId': videoId,
      },
      {
        _id: 0,
        videos: { $elemMatch: { videoId } },
      },
    );

    if (!weeklyVideo?.videos?.length) {
      return res.status(404).json({
        message: 'Weekly video not found',
      });
    }

    await WeeklyVideoMongoModel.updateOne(
      {
        orderId: order._id,
        week: order.currentWeek,
        'videos.videoId': videoId,
      },
      {
        $set: {
          'videos.$.check': weeklyVideo.videos[0]?.check ? false : true,
        },
      },
    );

    return res.status(200).json({
      message: 'Weekly video check updated successfully',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching weeklyVideo' });
  }
};
