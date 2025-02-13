import prisma from "../../client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import { addLocation, getLocationById, updateLocationById } from "../../model/location.model";
import {
  addLocationFormats,
  addMissingReport,
  getImageFormatsByPostId,
  getLocationFormatsByPostId,
  getPostByPostId,
  removePost,
  updateMissingReportByPostId,
  updateMissingReportCheckByPostId,
} from "../../model/missing.model";
import { getUserId, validateError } from "./Missings";
import { CATEGORY } from "../../constants/category";
import {
  deleteLocationsByLocationIds,
  getAndDeleteLocationFormats,
} from "../../util/locations/deleteLocations";
import {
  deleteImagesByImageIds,
  getAndDeleteImageFormats,
} from "../../util/images/deleteImages";
import { addNewImages } from "../../util/images/addNewImages";
import { getImageById } from "../../model/image.model";
import { PAGINATION } from "../../constants/pagination";
import { getPosts } from "./Common";
// import { notify } from "../notification/Notifications";
import { handleControllerError } from "../../util/errors/errors";
import { incrementViewCountAsAllowed } from "../common/Views";
import { uploadImagesToS3 } from "../../util/images/s3ImageHandler";

/* CHECKLIST
* [ ] 사용자 정보 가져오기 반영
* [ ] 구현 내용
*   [x] create
*   [x] delete
*   [x] get
*   [x] 전체 조회 
*     [x] 페이지네이션
*   [x] put
*     [x] 일치 및 불일치
*/
/**
 *
 * CHECKLIST
 * [x] 이미지 가져오기
 * [x] location 가져오기
 */

export const getMissingReports = async (req: Request, res: Response) => {
  const listData = {
    limit: Number(req.query.limit) || PAGINATION.LIMIT,
    cursor: req.query.cursor ? Number(req.query.cursor) : undefined,
    orderBy: { sortBy: "createdAt", sortOrder: "asc" },
    categoryId: CATEGORY.MISSING_REPORTS
  };
  const missingId = Number(req.params.missingId);
  return await getPosts(req, res, listData, missingId);
}

export const getMissingReport = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const userId = await getUserId(); // NOTE
      const postData = {
        postId,
        categoryId: CATEGORY.MISSING_REPORTS,
        userId
      }

      let post = await getPostByPostId(tx, postData);

      const locationFormats = await getLocationFormatsByPostId(tx, postData);
      if (locationFormats) {
        const locations = await Promise.all(locationFormats.map((locationFormat) => getLocationById(tx, locationFormat.locationId)));
        post = { ...post, locations };
      }

      const imageFormats = await getImageFormatsByPostId(tx, postData);
      if (imageFormats) {
        const images = await Promise.all(imageFormats.map((imageFormat) => getImageById(tx, imageFormat.imageId)));
        post = { ...post, images };
      }

      const viewIncrementResult = await incrementViewCountAsAllowed(req, tx, CATEGORY.MISSING_REPORTS, postId);
      post.views += viewIncrementResult || 0;

      return res
        .status(StatusCodes.OK)
        .json(post);
    });
  } catch (error) {
    if (error instanceof Error)
      validateError(res, error);
  }
};

export const createMissingReport = async (req: Request, res: Response) => {
  const uuid = req.user?.uuid;
  try {
    if (!uuid) {
      throw new Error("User UUID is missing.");
    }

    // const userId = await getUserId();
    const userId = Buffer.from(uuid, "hex");
    const missingId = Number(req.params.postId);
    console.log(req.body)
    const report = JSON.parse(req.body.report);
    const location = JSON.parse(req.body.location);
    console.log("받은 데이터", report, location)

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newLocation = await addLocation(tx, location);

      const post = await addMissingReport(tx, {
        ...report,
        uuid: userId,
        time: new Date(report.time),
        locationId: newLocation.locationId,
        missingId,
      });

      await addLocationFormats(tx, CATEGORY.MISSING_REPORTS, {
        postId: post.postId,
        locationId: newLocation.locationId,
      });

      if (req.files) {
        const imageUrls = (await uploadImagesToS3(req)) as any;
        await addNewImages(
          tx,
          {
            userId,
            postId: post.postId,
            categoryId: CATEGORY.MISSING_REPORTS,
          },
          imageUrls
        );
      }

      // notify({
      //   type: "newPost",
      //   receiver: userId, //NOTE userId를 실종고양이 게시글 게시자로 변경(-)
      //   sender: userId,
      //   url: `/boards/missings/${missingId}/reports/${post.postId}`
      // });
      console.log(post)
    });

    return res
      .status(StatusCodes.CREATED)
      .json({ message: "게시글이 등록되었습니다." });
  } catch (error) {
    console.log(error);
    if (error instanceof Error) validateError(res, error);
  }
};

/**
 * CHECKLIST
 * DELETE
 * [x] location 삭제
 * [x] images 삭제
 *
 * */

export const deleteMissingReport = async (
  req: Request,
  res: Response,
  postIdInput?: number
) => {
  try {
    const missingId = Number(req.params.missingId);
    const postId = postIdInput ? postIdInput : Number(req.params.postId);
    const userId = await getUserId(); // NOTE
    const postData = {
      userId,
      categoryId: CATEGORY.MISSING_REPORTS,
      postId,
    };

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const locations = await getAndDeleteLocationFormats(tx, postData);
      const images = await getAndDeleteImageFormats(tx, postData);

      await removePost(tx, postData);

      if (locations) await deleteLocationsByLocationIds(tx, locations);

      if (images) await deleteImagesByImageIds(tx, images);
    });

    return res.status(StatusCodes.OK).json("제보글 삭제");
  } catch (error) {
    return handleControllerError(error, res);
  }
};

export const deleteMissingReportHandler = async (
  req: Request,
  res: Response
) => {
  try {
    await deleteMissingReport(req, res);
  } catch (error) {
    if (error instanceof Error) return validateError(res, error);
  }
};

export const updateMissingReport = async (req: Request, res: Response) => {
  // NOTE Full Update?인지 확인
  try {
    const missingId = Number(req.params.missingId);
    const postId = Number(req.params.postId);
    const userId = await getUserId(); // NOTE
    const { report, location, images } = req.body;
    const postData = {
      postId,
      userId,
      categoryId: CATEGORY.MISSING_REPORTS,
    };

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const post = await getPostByPostId(tx, postData);
      if (!post || !report || !location)
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "입력값 확인 요망" });

      const locationId = post.locationId;
      if (locationId) await updateLocationById(tx, locationId, location);

      await updateMissingReportByPostId(
        tx,
        postId,
        userId,
        report.detail,
        new Date(report.time)
      );

      const imagesToDelete = await getAndDeleteImageFormats(tx, postData);

      if (imagesToDelete) await deleteImagesByImageIds(tx, imagesToDelete);

      if (images) {
        await addNewImages(tx, postData, images);
      }

      // notify({
      //   type: "update",
      //   receiver: userId, //NOTE userId를 실종고양이 게시글 게시자로 변경(-)
      //   sender: userId,
      //   url: `/boards/missings/${missingId}/reports/${postId}`
      // });
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: "게시글이 수정되었습니다." });
  } catch (error) {
    console.log(error);
    if (error instanceof Error) return validateError(res, error);
  }
};

export const updateMissingReportCheck = async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(); // NOTE
    const postData = {
      postId: Number(req.params.postId),
      categoryId: CATEGORY.MISSING_REPORTS,
      userId,
    };
    const { match } = req.body;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const reportPost = await getPostByPostId(tx, postData);
      const missingPost = await getPostByPostId(tx, {
        postId: reportPost.missingId,
        categoryId: CATEGORY.MISSINGS,
        userId: reportPost.uuid,
      }); // NOTE 게시글 작성자 인가 추가
      await updateMissingReportCheckByPostId(tx, postData, match);

      // notify({
      //   type: "match",
      //   receiver: userId,
      //   sender: userId, //NOTE userId를 실종고양이 게시글 게시자로 변경(-)
      //   result: match,
      //   url: `/boards/missings/${missingPost.postId}/reports/${postData.postId}`,
      // });

      return res
        .status(StatusCodes.OK)
        .json("게시글 상태가 업데이트 되었습니다.");
    });
  } catch (error) {
    console.log(error);
    if (error instanceof Error) return validateError(res, error);
  }
};
