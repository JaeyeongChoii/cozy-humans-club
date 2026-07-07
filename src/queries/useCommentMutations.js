// 댓글 작성/삭제 뮤테이션 (Phase 4).
//
// 설계: 서버가 단일 진실 소스다. 진단 결과 /home 목록 집계가 댓글 작성 '즉시' 갱신되므로
// (낙관적 +1/-1, 이벤트버스 같은 클라이언트 측 보정이 필요 없다) 뮤테이션 성공 후 관련 쿼리를
// invalidate해서 홈 피드(/home)와 글세부 댓글 목록(/comment)이 각자 서버 최신값을 다시 받게 한다.
//   - 낙관적 업데이트 없음 → 롤백/cancelQueries revert로 옛값이 되살아나는 race가 원천 차단된다.
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { commentApi } from "../api/commentApi";
import { THEME } from "../design/token/constantsTokens";

const resolveType = (post) =>
  post?.postType || (post?.posttext?.includes("Jam") ? THEME.JAM : THEME.JIN);

export function useCommentMutations(post) {
  const queryClient = useQueryClient();
  const id = post?.id;
  const type = resolveType(post);

  // 작성/삭제 성공 시 호출. 홈 피드·라이브러리·검색·모든 댓글 목록을 무효화한다.
  // 댓글 목록을 특정 글(type,id)이 아니라 ['comments'] 전체로 무효화하는 이유:
  // 대댓글을 달면 '그 댓글의 답글 목록'(['comments',COMMENT,commentId])뿐 아니라
  // 부모 글세부의 댓글 목록(['comments',글,글id])에 있는 '대댓글 수 배지'도 갱신돼야 하는데,
  // 뮤테이션은 부모 글 id를 모르므로 전체를 무효화해 부모도 다시 받게 한다.
  // (마운트된 쿼리만 즉시 재요청, 나머지는 다음 마운트 때 갱신되므로 비용은 작다)
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["comments"] });
    queryClient.invalidateQueries({ queryKey: ["library"] });
    queryClient.invalidateQueries({ queryKey: ["search"] });
  };

  const createComment = useMutation({
    // formData는 미디어/투표까지 포함해 호출부(Postbottom)에서 구성해 넘긴다.
    mutationFn: async ({ formData }) => {
      const res = await commentApi.createComment(id, type, formData);
      if (!res?.success) {
        throw new Error(res?.message || "댓글 등록에 실패했습니다.");
      }
      return res;
    },
    onSuccess: invalidateAll,
  });

  const deleteComment = useMutation({
    mutationFn: async ({ commentId }) => {
      const res = await commentApi.deleteComment(commentId);
      if (!res?.success) {
        throw new Error(res?.message || "댓글 삭제에 실패했습니다.");
      }
      return res;
    },
    onSuccess: invalidateAll,
  });

  return { createComment, deleteComment };
}
