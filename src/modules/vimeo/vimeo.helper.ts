import { vimeoClient } from '../../config/vimeo.config';
import { promisify } from 'util';
import fs from 'fs';

const unlinkAsync = promisify(fs.unlink);

export type UploadVideoVimeo = {
  name: string;
  description?: string;
  filePath: string;
};

export const uploadVideoToVimeo = (options: {
  video: UploadVideoVimeo;
  folderId?: string | number;
  isPrivate?: boolean;
}) => {
  const { video, folderId, isPrivate } = options;
  const { filePath, name, description } = video;

  const privacy = isPrivate
    ? {
        view: 'disable',
        embed: 'whitelist',
      }
    : {
        view: 'unlisted',
      };

  return new Promise((resolve, reject) => {
    vimeoClient.upload(
      filePath,
      {
        name,
        description,
        license: 'by',
        locale: 'es',
        privacy: {
          ...privacy,
          download: false,
          add: false,
        },
        embed: {
          logos: {
            vimeo: false,
          },
        },
      },
      async function (uri) {
        console.log(`✅ Video uploaded successfully: ${uri}`);
        await unlinkAsync(filePath);

        if (folderId) {
          const videoId = uri.split('/').pop();
          const folderPath = `/me/projects/${folderId}/videos/${videoId}`;

          vimeoClient.request(
            {
              method: 'PUT',
              path: folderPath,
            },
            function (error) {
              if (error) {
                console.error('❌ Error adding video to folder:', error);
                return reject({ success: false, error });
              }

              resolve({ success: true, uri, videoUrl: `https://vimeo.com${videoId}`, folderId });
            },
          );
        }

        resolve({ success: true, uri, videoUrl: `https://vimeo.com${uri}` });
      },
      function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(`${percentage}% uploaded`);
      },
      function (error) {
        console.error('❌ Vimeo upload error:', error);
        reject({ success: false, error });
      },
    );
  });
};

export const updateVideoToVimeo = (options: {
  idVideoVimeo: string;
  name?: string;
  description?: string;
}): Promise<void> => {
  const { idVideoVimeo, name, description } = options;
  return new Promise((resolve, reject) => {
    const query: any = {};
    if (name) query['name'] = name;
    if (description) query['description'] = description;

    vimeoClient.request(
      {
        method: 'PATCH',
        path: `/videos/${idVideoVimeo}`,
        query,
      },
      error => {
        if (error) {
          console.error('Error updating video:', error);
          return reject(error);
        }

        resolve();
      },
    );
  });
};

export const deleteVimeoVideo = (options: { idVideoVimeo: string }): Promise<void> => {
  const { idVideoVimeo } = options;
  return new Promise((resolve, reject) => {
    vimeoClient.request(
      {
        method: 'DELETE',
        path: `/videos/${idVideoVimeo}`,
      },
      error => {
        if (error) {
          console.error('Error deleting video:', error);
          return reject(error);
        }

        console.log('Video deleted successfully');
        resolve();
      },
    );
  });
};

export const getVimeoVideoById = (options: { id: string }) => {
  const { id } = options;

  return new Promise((resolve, reject) => {
    vimeoClient.request(
      {
        method: 'GET',
        path: `/me/videos/${id}`,
      },
      (error, body) => {
        if (error) {
          console.error('Error fetching video:', error);
          return reject(error);
        }
        resolve(body);
      },
    );
  });
};

export const getUrlTokenExtractVimeoVideoById = (options: { videoVimeo: any }) => {
  const { videoVimeo } = options;
  const progressVideo = videoVimeo?.play?.progressive;
  const lengthProgressVideo = progressVideo?.length;
  const linkVideo = progressVideo?.[lengthProgressVideo - 1]?.link;

  const sizesPictures = videoVimeo.pictures?.sizes;
  const thumbnail = sizesPictures?.[sizesPictures?.length - 1]?.link ?? '';

  return {
    linkVideo,
    thumbnail,
  };
};

export const getInfoPublicExtractVimeoVideoById = (options: { videoVimeo: any }) => {
  const { videoVimeo } = options;
  const { name, description, player_embed_url, duration, width, language, height, pictures } =
    videoVimeo;
  const thumbnail = pictures?.base_link ?? '';
  return {
    name,
    description,
    player_embed_url,
    duration,
    language,
    width,
    height,
    thumbnail,
  };
};
