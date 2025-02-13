// import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { IMenuList, IMissing, IMissingReport } from "../../../models/missing.model";
import { formatAgo, formatDate } from "../../../utils/format/format";
import Avatar from "../../common/Avatar";
import "./../../../styles/scss/components/missing/postHead.scss";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { isMissing } from "../../../utils/type/isMissing";
// import { useState } from "react";
// import PostMenu from "../../communityAndEvent/PostMenu";

export interface IMissingComponentProps {
  data: IMissing | IMissingReport;
  navigateUser?: boolean;
  menuList?: IMenuList;
  showMenu?: () => void;
}

const PostHead = ({
  data,
  // navigateUser,
  // menuList,
  showMenu,
}: IMissingComponentProps) => {
  // const navigate = useNavigate();
  // const navigateToUser = () =>
  //   navigateUser ? navigate(`/users/${1234}/profile`) : null; // 내비게이트값 변경 (-)
  const formatDateOrAgo = (date: string) => {
    const now = dayjs();
    const targetDate = dayjs(date);
    const differenceInDays = now.diff(targetDate, "day");

    if (differenceInDays < 7) {
      return formatAgo(date);
    } else {
      return formatDate(date);
    }
  };

  const navigateToUser = () => console.log("내비게이트");

  return (
    <section className="missing-post-head" key={data.postId}>
      <Avatar profileImage={data.users.profileImage} nickname={data.users.nickname} onClick={navigateToUser} />

      <div className="post-title" onClick={navigateToUser}>
        <div className="user-cat-name">
          {isMissing(data) && (
            <p>
              {data.users.nickname} 님네 {data.missingCats.name}
            </p>
          )}
          {!isMissing(data) && <p>{data.users.nickname} 님의 제보</p>}
        </div>
        <div className="created-at">
          <p>{formatDateOrAgo(data.createdAt)}</p>
          {data.createdAt === data.updatedAt ? null : <p>(수정됨)</p>}
        </div>
      </div>
      {!isMissing(data) && (
        <div className="match-check">
          <p className={`match-is-${data.match}`}>
            {data.match === "Y" ? "일치" : data.match === "N" ? "불일치" : "확인중"}
          </p>
        </div>
      )}
      <HiOutlineDotsVertical className="options-icon" onClick={showMenu} />
    </section>
  );
};

export default PostHead;
