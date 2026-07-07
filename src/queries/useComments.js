// 댓글 목록 쿼리. queryKey ['comments', type, id, sort]로 캐시된다.
// 작성/삭제 뮤테이션은 이 키(+['feed'])를 invalidate해서 상세·홈을 함께 재검증한다.
import { useQuery } from "@tanstack/react-query";

import { commentApi } from "../api/commentApi";
import { queryKeys } from "./keys";
import { THEME } from "../design/token/constantsTokens";

const resolveType = (post) =>
  post?.postType || (post?.posttext?.includes("Jam") ? THEME.JAM : THEME.JIN);

export function useComments(post, sortOrder) {
  const id = post?.id;
  const type = resolveType(post);
  const sort = sortOrder === "인기순" ? "popular" : "latest";

  return useQuery({
    queryKey: [...queryKeys.comments(type, id), sort],
    enabled: id != null,
    // 안드로이드 키보드 dismiss 시 AppState 블립이 뮤테이션 완료 전에 댓글을 조기 재요청하면
    // 아직 서버에 반영 안 된 구 count를 반환해 피드 캐시를 덮어쓴다. 댓글은 명시적
    // invalidateQueries(onSettled)와 당겨서 새로고침으로만 갱신한다.
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const result = await commentApi.fetchComments(type, id, sort);
      if (!result?.success) {
        throw new Error(result?.message || "댓글을 불러오지 못했습니다.");
      }
      // 이어서 게시(draft=1)는 항상 최상단에 '먼저 쓴 순(오래된 순)'으로 고정,
      // 그 아래로 일반 댓글이 선택된 정렬(최신순/인기순) 순서대로 노출
      const relay = result.comments
        .filter((c) => Number(c.draft) === 1)
        .sort((a, b) => (a.id || 0) - (b.id || 0));
      const normal = result.comments.filter((c) => Number(c.draft) !== 1);
      return { comments: [...relay, ...normal], count: result.comment_count };
    },
  });
}
