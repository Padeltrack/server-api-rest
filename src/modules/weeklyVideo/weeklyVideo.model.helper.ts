import { UserLevelModel } from '../user/user.model';
import { VideoMongoModel } from '../video/video.model';

export const getVideosByWeek = async (options: {
  week: number;
  levelUser: UserLevelModel;
  maxVideo?: number;
}) => {
  const { week, levelUser, maxVideo } = options;
  try {
    const videos = await VideoMongoModel.aggregate([
      {
        $match: { semanas: week, nivelFisico: levelUser },
      },
      { $sample: { size: maxVideo || 10 } },
      { $project: { _id: 1 } },
    ]);

    const ids = videos.map((video: any) => video._id);
    return ids;
  } catch (err) {
    console.error('Error obteniendo videos:', err);
    throw err;
  }
};
