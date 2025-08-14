import { getBufferBase64 } from '../../shared/util/string.util';
import { BASE_STORE_FIREBASE } from '../firebase/firebase.contants';
import { StorageFirebaseModel } from '../firebase/firebase.model';
import { uploadFileFirebaseStorage } from '../firebase/firebase.service';
import { UserModel, UserMongoModel } from './user.model';

export const generateUniqueUserName = async (baseName: string) => {
  const cleanBase = baseName.trim().toLowerCase().replace(/\s+/g, '');
  let candidate = cleanBase;
  let counter = 0;

  while (true) {
    const exists = await UserMongoModel.exists({ userName: candidate });
    if (!exists) break;
    counter += 1;
    candidate = `${cleanBase}${counter}`;
  }

  return candidate;
};

export const uploadImagePhotoUser = async (options: {
  imageBase64: string;
  idUser: UserModel['_id'];
}) => {
  const { imageBase64, idUser } = options;

  const { fileName, buffer } = getBufferBase64({ base64: imageBase64, name: idUser });

  uploadFileFirebaseStorage({
    path: `${StorageFirebaseModel.USER_PHOTO}/${fileName}`,
    buffer,
  });
  return `${BASE_STORE_FIREBASE}/${StorageFirebaseModel.USER_PHOTO}%2F${fileName}?alt=media`;
};
