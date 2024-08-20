import React, { useCallback, useRef } from "react";
import { AiFillHeart } from "react-icons/ai";
import "../../styles/css/components/streetCat/postDetail.css";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { IStreetCatDetail } from "../../models/streetCat.model";
import ImageCarousel from "../common/ImageCarousel";
import { IImage } from "../../models/image.model";
import FavoriteButton from "../common/FavoriteButton";

// NOTE ?를 이렇게 막..다 써도되나
interface IProps {
  postId?: number; 
  name?: string;
  createdAt?: Date;
  gender?: string;
  neutered?: string;
  content?: string;
  streetCatImages?: IImage[];
  streetCatFavorites?: [
    postId: number
  ]
}

const PostDetail = (props: IProps) => {
  console.log("props.streetCatFavorites?.postId", props.streetCatFavorites?.length);
  const images: IImage[] = props.streetCatImages || [];
  return (
    <>
      <div className="cat-container">
        <span className="cat-name">{props.name}</span>
        <ImageCarousel images={images} />

        <div className="cat-info">
          <div className="cat-tag">
            <span>{props.gender}</span>
            <span>{props.neutered}</span>
            <span>{props.createdAt ? 
              (typeof props.createdAt === 'string' || typeof props.createdAt === 'number'
                ? new Date(props.createdAt).toLocaleDateString()
                : props.createdAt.toLocaleDateString()) 
              : ""}
            </span>
          </div>
          <div className="btn-box">
            {
              props.postId !== undefined && props.streetCatFavorites?.length !== undefined
              ? <FavoriteButton postId={props.postId} like={props.streetCatFavorites?.length}/>
              : ""
            }
            <span className="more-btn"><HiOutlineDotsVertical /></span>
          </div>
        </div>

        <div className="cat-content">
          <p>
            {props.content}
          </p>
        </div>
      </div>
    </>
  )
}

export default PostDetail;

