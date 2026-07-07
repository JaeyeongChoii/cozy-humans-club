// 검색 결과 쿼리. queryKey ['search', tab, keyword]로 캐시된다.
// 탭/키워드별로 따로 캐시되어, 이미 본 탭으로 돌아오면 즉시 표시되고
// 댓글/좋아요 등 변경은 setQueryData·invalidate로 함께 반영된다(홈/라이브러리와 동일 패턴).
import { useQuery } from "@tanstack/react-query";

import { postApi } from "../api/postApi";
import { SearchTabTypes } from "../constants/SearchTabTypes";

const tabToBackend = (tab) =>
  tab === SearchTabTypes.JAM
    ? "talk"
    : tab === SearchTabTypes.JIN
      ? "think"
      : "user"; // SearchTabTypes.USER

async function runSearch(tab, keyword) {
  if (!keyword?.trim()) return [];

  if (tab === SearchTabTypes.ALL) {
    // '모두' 탭: 자유(talk) + 진지(think)를 합친다.
    const [talk, think] = await Promise.all([
      postApi.search("talk", keyword, 0),
      postApi.search("think", keyword, 0),
    ]);
    return [...(talk || []), ...(think || [])];
  }

  const results = await postApi.search(tabToBackend(tab), keyword, 0);
  return results || [];
}

export function useSearch(tab, keyword, enabled) {
  return useQuery({
    queryKey: ["search", tab, keyword],
    queryFn: () => runSearch(tab, keyword),
    enabled: !!enabled && !!keyword?.trim(),
  });
}
