import { vimeoClient } from '../../config/vimeo.config';

export const uploadVideoToVimeo = (options: {
  filePath: string;
  fileName: string;
  folderId?: string;
}) => {
  const { filePath, fileName, folderId } = options;
  return new Promise((resolve, reject) => {
    vimeoClient.upload(
      filePath,
      {
        name: fileName,
        description: 'Video subido desde la plataforma',
        privacy: {
          view: 'unlisted',
        },
      },
      function (uri) {
        console.log(`✅ Video uploaded successfully: ${uri}`);

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
