// 좋아요/북마크/삭제를 공유 RQ 캐시에 '직접' 반영하는 헬퍼.
// 이벤트버스(DeviceEventEmitter) 대신 ['feed',*]·['library']·['search',*] 캐시를 한 번에 갱신해
// 홈/라이브러리/검색이 동시에 같은 값을 보게 한다. (훅이 아니므로 컴포넌트 밖에서도 호출 가능)
import { queryClient } from "../lib/queryClient";

const matches = (post, id, postType) =>
  post?.id === id && (postType && post?.postType ? post.postType === postType : true);

// 모든 공유 캐시에서 일치하는 글을 patch로 부분 갱신 (좋아요/북마크 등)
export function patchPostEverywhere(id, postType, patch) {
  // feed: 무한 쿼리 { pages: [[...posts]] }
  queryClient.setQueriesData({ queryKey: ["feed"] }, (old) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) =>
        page.map((p) => (matches(p, id, postType) ? { ...p, ...patch } : p)),
      ),
    };
  });

  // library: { postList, likeList, bookList, commentList, quoteList }
  queryClient.setQueriesData({ queryKey: ["library"] }, (old) => {
    if (!old) return old;
    const upd = (list) =>
      Array.isArray(list)
        ? list.map((p) => (matches(p, id, postType) ? { ...p, ...patch } : p))
        : list;
    return {
      ...old,
      postList: upd(old.postList),
      likeList: upd(old.likeList),
      bookList: upd(old.bookList),
      commentList: upd(old.commentList),
      quoteList: upd(old.quoteList),
    };
  });

  // search: [...posts]
  queryClient.setQueriesData({ queryKey: ["search"] }, (old) =>
    Array.isArray(old)
      ? old.map((p) => (matches(p, id, postType) ? { ...p, ...patch } : p))
      : old,
  );
}

// 모든 공유 캐시에서 글을 제거 (게시글 삭제)
export function removePostEverywhere(id, postType) {
  queryClient.setQueriesData({ queryKey: ["feed"] }, (old) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) => page.filter((p) => !matches(p, id, postType))),
    };
  });

  queryClient.setQueriesData({ queryKey: ["library"] }, (old) => {
    if (!old) return old;
    const flt = (list) =>
      Array.isArray(list) ? list.filter((p) => !matches(p, id, postType)) : list;
    return {
      ...old,
      postList: flt(old.postList),
      likeList: flt(old.likeList),
      bookList: flt(old.bookList),
      commentList: flt(old.commentList),
      quoteList: flt(old.quoteList),
    };
  });

  queryClient.setQueriesData({ queryKey: ["search"] }, (old) =>
    Array.isArray(old) ? old.filter((p) => !matches(p, id, postType)) : old,
  );
}
