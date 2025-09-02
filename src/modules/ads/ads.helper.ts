import { processImageResize } from '../../shared/util/image.util';
import { getBufferBase64 } from '../../shared/util/string.util';
import { BASE_STORE_FIREBASE } from '../firebase/firebase.contants';
import { StorageFirebaseModel } from '../firebase/firebase.model';
import { uploadFileFirebaseStorage } from '../firebase/firebase.service';
import { AdsModel } from './ads.model';

export const uploadImagePhotoUser = async (options: {
  imageBase64: string;
  idAds: AdsModel['_id'];
}) => {
  const { imageBase64, idAds } = options;

  const { fileName, buffer } = getBufferBase64({ base64: imageBase64, name: idAds });

  const imageBuffer = await processImageResize({
    buffer,
    width: 840,
    height: 360,
  });

  uploadFileFirebaseStorage({
    path: `${StorageFirebaseModel.ADS_IMAGE}/${fileName}`,
    buffer: imageBuffer,
  });
  return `${BASE_STORE_FIREBASE}/${StorageFirebaseModel.ADS_IMAGE}%2F${fileName}?alt=media`;
};
