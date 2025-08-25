import { getBufferBase64 } from '../../shared/util/string.util';
import { BASE_STORE_FIREBASE } from '../firebase/firebase.contants';
import { StorageFirebaseModel } from '../firebase/firebase.model';
import { uploadFileFirebaseStorage } from '../firebase/firebase.service';
import { ScreenshotsMatchModel } from './match.model';

export const uploadImageScreenshotMatch = async (options: {
  imageBase64: string;
  idScreenshot: ScreenshotsMatchModel['_id'];
}) => {
  const { imageBase64, idScreenshot } = options;

  const { fileName, buffer } = getBufferBase64({ base64: imageBase64, name: idScreenshot });

  uploadFileFirebaseStorage({
    path: `${StorageFirebaseModel.SCREENSHOT_MATCH}/${fileName}`,
    buffer,
  });
  return `${BASE_STORE_FIREBASE}/${StorageFirebaseModel.SCREENSHOT_MATCH}%2F${fileName}?alt=media`;
};
