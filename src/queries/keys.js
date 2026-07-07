// 쿼리 키 팩토리 — 모든 화면이 동일한 키로 같은 캐시 엔트리를 가리키게 한다.
// 키가 일치해야 한 곳에서 무효화/갱신했을 때 다른 화면도 함께 반영된다.
//
// 사용 예)
//   useInfiniteQuery({ queryKey: queryKeys.feed(tab), ... })   // 홈 피드(탭별)
//   useQuery({ queryKey: queryKeys.post(type, id), ... })      // 글 상세
//   useQuery({ queryKey: queryKeys.comments(type, id), ... })  // 댓글 목록
//   queryClient.invalidateQueries({ queryKey: queryKeys.comments(type, id) })
export const queryKeys = {
  all: ["deeptalk"],
  feed: (tab) => ["feed", tab],
  post: (type, id) => ["post", String(type), String(id)],
  comments: (type, id) => ["comments", String(type), String(id)],
};
