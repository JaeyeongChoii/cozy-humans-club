// 홈 피드(탭별) 무한 스크롤 쿼리.
// queryKey ['feed', tab]로 캐시되며, 같은 키를 쓰는 어떤 화면/뮤테이션이 갱신해도 함께 반영된다.
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { postApi } from "../api/postApi";
import { queryKeys } from "./keys";
import { THEME } from "../design/token/constantsTokens";

// 한 페이지 응답이 이 수보다 적으면 마지막 페이지로 간주(기존 fetchPosts 로직과 동일).
const PAGE_SIZE = 10;

const tabToType = (tab) => (tab === THEME.JIN ? "Jin-Talk" : "Jam-Talk");

export function useFeed(tab) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.feed(tab),
    queryFn: ({ pageParam = 0 }) => postApi.fetchHomePosts(tabToType(tab), pageParam),
    initialPageParam: 0,
    // 피드의 댓글 수/점등은 뮤테이션의 낙관적 업데이트가 단일 진실이다.
    // 포커스 복귀(특히 안드로이드의 AppState 'active' 블립)로 피드를 강제 refetch하면
    // 아직 지연된 서버 집계(예: 방금 단 댓글이 빠진 옛 comment 수)가 낙관적 값을 덮어써
    // "잠깐 4 → 갑자기 3"으로 되돌아간다. 그래서 포커스 자동 재요청은 끄고,
    // 갱신은 탭 전환/당겨서 새로고침/화면 복귀(useFocusEffect)로만 한다.
    refetchOnWindowFocus: false,
    // 다음 페이지 번호 = 지금까지 받은 페이지 수(0-base). 마지막 페이지가 PAGE_SIZE 미만이면 끝.
    getNextPageParam: (lastPage, allPages) =>
      Array.isArray(lastPage) && lastPage.length >= PAGE_SIZE
        ? allPages.length
        : undefined,
  });

  // 페이지들을 단일 배열로 평탄화 + id 중복 제거(기존 fetchPosts의 중복 방지 로직 유지)
  const posts = useMemo(() => {
    const flat = (query.data?.pages || []).flat();
    const seen = new Set();
    const result = [];
    for (const p of flat) {
      if (!p) continue;
      if (p.id != null) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
      }
      result.push(p);
    }
    return result;
  }, [query.data]);

  return { ...query, posts };
}
