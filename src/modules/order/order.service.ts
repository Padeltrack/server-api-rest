import { getBufferBase64 } from '../../shared/util/string.util';
import { BASE_STORE_FIREBASE } from '../firebase/firebase.contants';
import { StorageFirebaseModel } from '../firebase/firebase.model';
import { uploadFileFirebaseStorage } from '../firebase/firebase.service';
import { IOrderModel } from './order.model';

export const uploadImageBanner = async (options: {
  imageBase64: string;
  idOrder: IOrderModel['_id'];
}) => {
  const { imageBase64, idOrder } = options;

  const { fileName, buffer } = getBufferBase64({ base64: imageBase64, name: idOrder });

  uploadFileFirebaseStorage({
    path: `${StorageFirebaseModel.PROOF_OF_PAYMENT}/${fileName}`,
    buffer,
  });
  return `${BASE_STORE_FIREBASE}/${StorageFirebaseModel.PROOF_OF_PAYMENT}%2F${fileName}?alt=media`;
};
