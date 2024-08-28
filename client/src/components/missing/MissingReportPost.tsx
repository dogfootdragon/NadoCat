import {
  /*IMissing,*/ IMissing,
  IMissingReport,
} from "../../models/missing.model";
import "./../../styles/scss/components/missing/missingReportPost.scss";
import PostHead from "./missingPost/PostHead";
import PostSummary from "./common/PostSummary";
import MapBox from "../common/MapBox";
import { useState } from "react";
import MissingReportPostMenu from "./MissingReportPostMenu";
import { useParams } from "react-router-dom";
import { useDeleteMissingReport } from "../../hooks/useMissingReport";

interface IProps {
  post: IMissingReport;
  missing: IMissing;
}

const MissingReportPost = ({ post, missing }: IProps) => {
  const [isShowMenu, setIsShowMenu] = useState(false);
  const showMenu = () => {
    setIsShowMenu((prev) => !prev);
    console.log("show?", isShowMenu);
  };
  const loginUser = sessionStorage.getItem("uuid") || "";
  const postId = Number(useParams().id);
  const { mutateAsync: deletePost } = useDeleteMissingReport();

  return (
    <section className={`report-post-box ${post.match}`}>
      <PostHead data={post} showMenu={showMenu} />
      <div className="image-map">
        <div className="image-container">
          <img src="/src/assets/img/heartCat.png" />
        </div>
        <div className="map-container">
          <MapBox locations={post.locations} />
        </div>
      </div>
      <MissingReportPostMenu
        postUser={post.users.uuid}
        loginUser={loginUser}
        ownerUser={missing.users.uuid}
        reportId={post.postId}
        deletePost={deletePost}
        matchState={post.match}
        postId={postId}
        showMenu={showMenu}
        isShowMenu={isShowMenu}
      />
      <PostSummary data={post} />
    </section>
  );
  // 좋아요 리포트 수 (-)
};

export default MissingReportPost;
