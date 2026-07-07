// 라이브러리(내 프로필 + 활동 리스트) 쿼리.
// queryKey ['library']로 캐시되며, 댓글/좋아요/삭제 등 어떤 화면의 변경이든 이 키를
// invalidate하거나 setQueryData로 갱신하면 라이브러리가 함께 반영된다(홈 피드와 동일 패턴).
import { useQuery } from "@tanstack/react-query";

import { postApi } from "../api/postApi";

export const libraryKey = ["library"];

const isTruthySetting = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const EMPTY_PROFILE = {
  writterId: "",
  userId: "",
  nickname: "",
  imageUrl: null,
  statusMessage: "",
  hideFollowList: false,
  following: 0,
  follower: 0,
};

// 라이브러리 화면이 필요로 하는 모든 데이터를 한 번에 모은다(기존 refreshLibraryData와 동일).
async function fetchLibrary() {
  const accountData = await postApi.fetchAccountInfo();
  const currentUserId = accountData?.currentUser_id;

  let profile = EMPTY_PROFILE;
  let postList = [];

  if (currentUserId) {
    const {
      currentId,
      currentNickname,
      currentImage,
      currentStatusMessage,
      currentHideFollowList,
      currentFollowCount,
      currentFollowerCount,
    } = await postApi.fetchProfileInfo(currentUserId);

    profile = {
      writterId: currentId || "",
      userId: currentUserId,
      nickname: currentNickname || "",
      imageUrl: currentImage || null,
      statusMessage: currentStatusMessage ?? "",
      hideFollowList: isTruthySetting(currentHideFollowList),
      following: currentFollowCount ?? 0,
      follower: currentFollowerCount ?? 0,
    };

    const [talkData, thinkData] = await Promise.all([
      postApi.fetchUserPost(currentUserId, "talk"),
      postApi.fetchUserPost(currentUserId, "think"),
    ]);
    postList = [...(talkData || []), ...(thinkData || [])];
  }

  const [likeList, bookList, commentList, quoteList] = await Promise.all([
    postApi.fetchLikeList(),
    postApi.fetchBookmarkList(),
    postApi.fetchCommentList(),
    postApi.fetchQuoteList(),
  ]);

  return {
    profile,
    postList,
    likeList: likeList || [],
    bookList: bookList || [],
    commentList: commentList || [],
    quoteList: quoteList || [],
  };
}

export function useLibrary() {
  return useQuery({
    queryKey: libraryKey,
    queryFn: fetchLibrary,
  });
}
