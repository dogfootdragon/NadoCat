import { Prisma } from "@prisma/client";
import { deleteImages, deleteProfileImage, getImageById } from "../../model/image.model";
import { IImageBridge } from "../../types/image";
import {
  deleteImageFormats,
  getImageFormatsByPostId,
} from "../../model/missing.model";

import { IPostData } from "../../types/post";

export const getAndDeleteImageFormats = async (
  tx: Prisma.TransactionClient,
  postData: IPostData
) => {
  const images = await getImageFormatsByPostId(tx, postData);
  await deleteImageFormats(tx, postData);
  return images;
};

export const deleteImagesByImageIds = async (
  tx: Prisma.TransactionClient,
  images: IImageBridge[]
) => {
  const formattedImages = images.map((image) => image.imageId);
  return await deleteImages(tx, formattedImages);
};


// 프로필 이미지 삭제
export const deleteProfileImages = async (
    uuid: string, imageUrl: string) => {
    const deleteImage = await deleteProfileImage(uuid, imageUrl);

    return deleteImage;
}