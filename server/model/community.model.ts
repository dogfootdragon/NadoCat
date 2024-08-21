import { Prisma } from "@prisma/client";
import prisma from "../client";
import { ICommunity, ICommunityImage, ICommunityTag } from "../types/community";
import { CATEGORY } from "../constants/category";
import { getOrderBy } from "../util/sort/orderBy";
import { SortOrder } from "../types/sort";

export const getCommunitiesCount = async () => await prisma.communities.count();

export const getCommunityList = async (
  limit: number,
  sort: string,
  cursor: number | undefined
) => {
  const categoryId = CATEGORY.COMMUNITIES;
  const orderBy = getOrderBy(sort);
  const orderOptions = [];

  if (orderBy.sortBy === "likes") {
    orderOptions.push({
      communityLikes: {
        _count: orderBy.sortOrder as SortOrder,
      },
    });
  } else {
    orderOptions.push({
      [orderBy.sortBy]: orderBy.sortOrder as SortOrder,
    });
  }

  const communities = await prisma.communities.findMany({
    where: {
      categoryId,
    },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { postId: cursor } : undefined,
    orderBy: orderOptions,
    include: {
      users: {
        select: {
          id: true,
          uuid: true,
          nickname: true,
          profileImage: true,
        },
      },
      communityImages: {
        take: 1,
        select: {
          images: {
            select: {
              imageId: true,
              url: true,
            },
          },
        },
      },
      communityTags: {
        select: {
          tags: {
            select: {
              tagId: true,
              tag: true,
            },
          },
        },
      },
      _count: {
        select: {
          communityLikes: true,
        },
      },
    },
  });

  return communities.map((community: ICommunity) => {
    return {
      postId: community.postId,
      categoryId: community.categoryId,
      title: community.title,
      content: community.content,
      views: community.views,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      users: {
        id: community?.users.id,
        uuid: (community?.users.uuid as Buffer).toString("hex"),
        nickname: community?.users.nickname,
        profileImage: community?.users.profileImage,
      },
      tags: community.communityTags.map((item: ICommunityTag) => item.tags),
      thumbnail:
        community.communityImages
          .map((item: ICommunityImage) => item.images.url)
          .join("") ?? null,
      likes: community._count.communityLikes,
    };
  });
};

export const getCommunityById = async (postId: number) => {
  const categoryId = CATEGORY.COMMUNITIES;
  const community = await prisma.communities.findUnique({
    where: {
      postId,
      categoryId,
    },
    select: {
      postId: true,
      categoryId: true,
      title: true,
      content: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      users: {
        select: {
          id: true,
          uuid: true,
          nickname: true,
          profileImage: true,
        },
      },
      communityImages: {
        select: {
          images: {
            select: {
              imageId: true,
              url: true,
            },
          },
        },
      },
      communityTags: {
        select: {
          tags: {
            select: {
              tagId: true,
              tag: true,
            },
          },
        },
      },
      _count: {
        select: {
          communityLikes: true,
        },
      },
    },
  });

  if (!community) {
    return null;
  }

  return {
    postId: community.postId,
    categoryId: community.categoryId,
    title: community.title,
    content: community.content,
    views: community.views,
    createdAt: community.createdAt,
    updatedAt: community.updatedAt,
    users: {
      id: community?.users.id,
      uuid: (community?.users.uuid as Buffer).toString("hex"),
      nickname: community?.users.nickname,
      profileImage: community?.users.profileImage,
    },
    tags: community?.communityTags.map((item: ICommunityTag) => item.tags),
    images: community?.communityImages.map(
      (item: ICommunityImage) => item.images
    ),
    likes: community._count.communityLikes,
  };
};

export const addCommunity = async (
  tx: Prisma.TransactionClient,
  userId: string,
  title: string,
  content: string
) => {
  const categoryId = CATEGORY.COMMUNITIES;
  return await tx.communities.create({
    data: {
      uuid: Buffer.from(userId, "hex"),
      title,
      content,
      categoryId,
    },
  });
};

export const updateCommunityById = async (
  tx: Prisma.TransactionClient,
  postId: number,
  userId: string,
  title: string,
  content: string
) => {
  const categoryId = CATEGORY.COMMUNITIES;
  return await tx.communities.update({
    where: {
      postId,
      uuid: Buffer.from(userId, "hex"),
      categoryId,
    },
    data: {
      title,
      content,
    },
  });
};

export const removeCommunityById = async (
  tx: Prisma.TransactionClient,
  postId: number,
  userId: string
) => {
  const categoryId = CATEGORY.COMMUNITIES;
  return await tx.communities.delete({
    where: {
      postId,
      uuid: Buffer.from(userId, "hex"),
      categoryId,
    },
  });
};

export const addCommunityTags = async (
  tx: Prisma.TransactionClient,
  tags: {
    postId: number;
    tagId: number;
  }[]
) => {
  return await tx.communityTags.createMany({
    data: tags,
  });
};

export const addCommunityImages = async (
  tx: Prisma.TransactionClient,
  images: {
    postId: number;
    imageId: number;
  }[]
) => {
  return await tx.communityImages.createMany({
    data: images,
  });
};

export const removeTagsByIds = async (
  tx: Prisma.TransactionClient,
  tagIds: number[]
) => {
  return await tx.communityTags.deleteMany({
    where: {
      tagId: {
        in: tagIds,
      },
    },
  });
};

export const removeImagesByIds = async (
  tx: Prisma.TransactionClient,
  imageIds: number[]
) => {
  return await tx.communityImages.deleteMany({
    where: {
      imageId: {
        in: imageIds,
      },
    },
  });
};

export const getLikeIds = async (postId: number) => {
  return await prisma.communityLikes.findMany({
    where: {
      postId,
    },
    select: {
      likeId: true,
    },
  });
};

export const removeLikesById = async (
  tx: Prisma.TransactionClient,
  postId: number
) => {
  return await tx.communityLikes.deleteMany({
    where: {
      postId,
    },
  });
};
