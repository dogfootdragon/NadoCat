import { Prisma } from "@prisma/client";
import { IMissingCat, IMissingCreate, IMissingGet, IMissingReport } from "../types/missing";
import { IImageBridge } from "../types/image";
import { TCategoryId } from "../types/category";
import { IListData, IPostData } from "../types/post";
import { ILocationBridge } from "../types/location";
import prisma from "../client";
import { getCategoryModel } from "./common/model.model";

const missingDataSelect = {
  postId: true,
  uuid: false,
  categoryId: false,
  catId: false,
  time: true,
  locationId: false,
  found: true,
  views: true,
  createdAt: true,
  updatedAt: true,
  users: {
    select: {
      nickname: true,
      profileImage: true,
      uuid: true,
      id: true
    }
  },
  missingCats: {
    select: {
      missingCatId: true,
      name: true,
      birth: true,
      detail: true,
      gender: true
    }
  },
  locations: {
    select: {
      locationId: true,
      latitude: true,
      longitude: true,
      detail: true
    }
  }
}

const missingReportDataSelect = {
  postId: true,
  uuid: false,
  categoryId: false,
  missingId: true,
  time: true,
  locationId: false,
  match: true,
  views: true,
  createdAt: true,
  updatedAt: true,
  users: {
    select: {
      nickname: true,
      profileImage: true,
      uuid: true,
      id: true
    }
  },
  locations: {
    select: {
      locationId: true,
      latitude: true,
      longitude: true,
      detail: true
    }
  }
}


export const addMissing = async (
  tx: Prisma.TransactionClient,
  missing: IMissingCreate
) => {
  return await tx.missings.create({
    data: missing,
  });
};

export const addMissingCat = async (
  tx: Prisma.TransactionClient,
  cat: IMissingCat
) => {
  return await tx.missingCats.create({
    data: {
      ...cat,
      birth: new Date(cat.birth as string)
    },
  })
}

export const getPostList = async (
  listData: IListData,
  missingId?: number
): Promise<any> => {
  const { categoryId } = listData;
  switch (categoryId) {
    case 3: return await getMissingsList(listData);
    case 4: return await getMissingReportsList(listData, missingId as number);
  }
};

const getMissingsList = async (
  listData: IListData
) => {
  const { limit, cursor, orderBy } = listData;

  const fetchMissingsByFoundStatus = async (
    foundStatus: number,
    limit: number,
    cursor?: number
  ) => {
    return await prisma.missings.findMany({
      where: {
        found: foundStatus,
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { postId: cursor } : undefined,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          postId: "desc",
        },
      ],
      select: missingDataSelect
    });
  };
  const unfoundList = await fetchMissingsByFoundStatus(0, limit, cursor);
  const remainingLimit = limit - unfoundList.length;
  let foundList = remainingLimit > 0 ? await fetchMissingsByFoundStatus(1, remainingLimit, cursor) : [];

  const posts = [...unfoundList, ...foundList];

  return posts;
}

const getMissingReportsList = async (
  listData: IListData,
  missingId: number,
) => {
  const { limit, cursor, orderBy } = listData;

  const fetchMissingReportsByFoundStatus = async (
    matchStatus: string,
    missingId: number,
    limit: number,
    cursor?: number | undefined
  ) => {
    return await prisma.missingReports.findMany({
      where: {
        missingId,
        match: matchStatus
      },
      select: missingReportDataSelect,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { postId: cursor } : undefined,
      orderBy: [
        {
          [orderBy.sortBy]: orderBy.sortOrder,
        },
        {
          postId: "desc",
        },
      ],
    });
  };
  const matchList = await fetchMissingReportsByFoundStatus("Y", missingId, limit, cursor);
  let remainingLimit = limit - matchList.length;
  const checkingList = remainingLimit > 0 ? await fetchMissingReportsByFoundStatus("-", missingId, remainingLimit, cursor) : [];

  let posts = [...matchList, ...checkingList];

  remainingLimit = limit - posts.length;

  const unmatchList = await fetchMissingReportsByFoundStatus("N", missingId, limit, cursor);

  posts = [...posts, ...unmatchList];

  return posts;
}

export const getPostsCount = async (
  categoryId: TCategoryId
) => {
  switch (categoryId) {
    case 3: return await prisma.missings.count();
    case 4: return await prisma.missingReports.count();
    default: return new Error("잘못된 카테고리 ID");
  }
};

export const removePost = async (
  tx: Prisma.TransactionClient,
  postData: IPostData
) => {
  const model = getCategoryModel(postData.categoryId)
  console.log("여기는 remove", model)

  if (model) {
    return await (tx as any)[model].delete({
      where: {
        postId: postData.postId,
        categoryId: postData.categoryId,
      },
    });
  }
};

export const addImageFormats = async (
  tx: Prisma.TransactionClient,
  categoryId: TCategoryId,
  images: IImageBridge[]
) => {
  switch (categoryId) {
    case 3:
      return await tx.missingImages.createMany({
        data: images,
      });
    case 4:
      return await tx.missingReportImages.createMany({
        data: images,
      });
  }
};

export const addLocationFormats = async (
  tx: Prisma.TransactionClient,
  categoryId: TCategoryId,
  location: ILocationBridge
) => {
  switch (categoryId) {
    case 3:
      return await tx.missingLocations.create({
        data: location,
      });
    case 4:
      return await tx.missingReportLocations.create({
        data: location,
      });
  }
};

export const deleteImageFormats = async (
  tx: Prisma.TransactionClient,
  postData: IPostData
) => {
  switch (postData.categoryId) {
    case 3:
      return await tx.missingImages.deleteMany({
        where: {
          postId: postData.postId,
        },
      });
    case 4:
      return await tx.missingReportImages.deleteMany({
        where: {
          postId: postData.postId,
        },
      });
  }
};

export const removeImagesByIds = async (tx: Prisma.TransactionClient, imageIds: number[]) => {
  return await tx.missingImages.deleteMany({
    where: {
      imageId: {
        in: imageIds,
      },
    },
  });
};

export const deleteLocationFormats = async (
  tx: Prisma.TransactionClient,
  postData: IPostData
) => {
  switch (postData.categoryId) {
    case 3:
      return await tx.missingLocations.deleteMany({
        where: {
          postId: postData.postId,
        },
      });
    case 4:
      return await tx.missingReportLocations.deleteMany({
        where: {
          postId: postData.postId,
        },
      });
  }
};

export const getPostByPostId = async (
  tx: Prisma.TransactionClient,
  postData: IPostData
): Promise<any> => {
  switch (postData.categoryId) {
    case 3:
      return await tx.missings.findUnique({
        where: {
          postId: postData.postId,
        },
        select: {
          ...missingDataSelect,
          detail: true
        }
      });
    case 4:
      return await tx.missingReports.findUnique({
        where: {
          postId: postData.postId,
        },
      });
  }
};

export const getMissingById = async (
  tx: Prisma.TransactionClient,
  postId: number
): Promise<any> => {
  return await tx.missings.findUnique({
    where: {
      postId: postId,
    }
  });
};



export const getLocationFormatsByPostId = async (
  tx: Prisma.TransactionClient,
  postData: IPostData
) => {
  switch (postData.categoryId) {
    case 3:
      return await tx.missingLocations.findMany({
        where: {
          postId: postData.postId,
        },
      });
    case 4:
      return await tx.missingReportLocations.findMany({
        where: {
          postId: postData.postId,
        },
      });
  }
};

export const getReportCount = async (
  postId: number
) => {
  return await prisma.missingReports.count({
    where: {
      missingId: postId
    }
  })
}

export const getImageFormatsByPostId = async (
  tx: Prisma.TransactionClient,
  postData: {
    categoryId: number;
    postId: number;
  }
) => {
  switch (postData.categoryId) {
    case 3:
      return await tx.missingImages.findMany({
        where: {
          postId: postData.postId,
        },
      });
    case 4:
      return await tx.missingReportImages.findMany({
        where: {
          postId: postData.postId,
        },
      });
  }
};

export const getMissingReportsByMissingId = async (
  tx: Prisma.TransactionClient,
  missingId: number
) => {
  return await tx.missingReports.findMany({
    where: {
      missingId,
    },
  });
};

export const addMissingReport = async (
  tx: Prisma.TransactionClient,
  missingReport: IMissingReport
) => {
  return await tx.missingReports.create({
    data: missingReport,
  });
};

export const updateMissingByPostId = async (
  tx: Prisma.TransactionClient,
  postId: number,
  uuid: Buffer,
  missing: {
    time: string,
    detail: string
  }
) => {
  return await tx.missings.update({
    where: {
      postId,
      uuid,
    },
    data: {
      time: new Date(missing.time),
      detail: missing.detail
    },
  });
};

export const updateMissingCatByCat = async (
  tx: Prisma.TransactionClient,
  catId: number,
  cat: {
    name: string,
    birth: string,
    detail: string,
    gender: string
  }
) => {
  return await tx.missingCats.update({
    where: {
      missingCatId: catId
    },
    data: {
      ...cat,
      birth: new Date(cat.birth as string)
    },
  });
};

export const updateMissingReportByPostId = async (
  tx: Prisma.TransactionClient,
  postId: number,
  uuid: Buffer,
  detail: string,
  time: Date
) => {
  return await tx.missingReports.update({
    where: {
      postId,
      uuid,
    },
    data: {
      time,
      detail,
    },
  });
};

export const updateFoundByPostId = async (
  tx: Prisma.TransactionClient,
  postData: IPostData,
  found: boolean
) => {
  return await tx.missings.update({
    where: {
      uuid: postData.userId,
      postId: postData.postId,
    },
    data: {
      found: Number(found),
    },
  });
};

export const updateMissingReportCheckByPostId = async (
  tx: Prisma.TransactionClient,
  postData: IPostData,
  match: string
) => {
  console.log(match)
  return await tx.missingReports.update({
    where: {
      // uuid: postData.userId,
      postId: postData.postId,
    },
    data: {
      match,
    },
  });
};

export const deleteMissingCat = async (
  tx: Prisma.TransactionClient,
  catId: number,
  uuid: Buffer
) => {
  await tx.missingCats.delete({
    where: {
      missingCatId: catId,
      uuid
    }
  });
}