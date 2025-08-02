import { vimeoClient } from '../../config/vimeo.config';
import { promisify } from 'util';
import fs from 'fs';

const unlinkAsync = promisify(fs.unlink);

export type UploadVideoVimeo = {
  name: string;
  description?: string;
  filePath: string;
}

export const uploadVideoToVimeo = (options: {
  video: UploadVideoVimeo;
  folderId?: string;
  isPrivate?: boolean;
}) => {
  const { video, folderId, isPrivate } = options;
  const { filePath, name, description } = video;

  const privacy = isPrivate ? {
    view: 'disable',
    embed: 'whitelist',
  } : {
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
          add: false
        },
        embed: {
          logos: {
            vimeo: false
          }
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

export const deleteVimeoVideo = (options: { idVideoVimeo: string }): Promise<void> => {
  const { idVideoVimeo } = options;
  return new Promise((resolve, reject) => {
    vimeoClient.request(
      {
        method: 'DELETE',
        path: `/videos/${idVideoVimeo}`,
      },
      (error) => {
        if (error) {
          console.error('Error deleting video:', error);
          return reject(error);
        }

        console.log('Video deleted successfully');
        resolve();
      }
    );
  });
};
