// React Query(TanStack Query v5) 전역 클라이언트.
// 앱 전체가 이 단일 캐시를 공유한다 → 홈/라이브러리/검색/글세부가 같은 게시물 상태를 본다.
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime 동안은 캐시를 즉시 보여주고, 지나면 포커스/마운트 시 백그라운드로 재검증
      // (stale-while-revalidate). 화면 전환 때마다 깜빡임 없이 항상 최신을 향해 수렴한다.
      staleTime: 1000 * 30, // 30초
      gcTime: 1000 * 60 * 5, // 5분간 미사용 캐시 보관
      retry: 1,
      refetchOnWindowFocus: true, // RN에서는 focusManager(AppState)가 'focus'를 공급한다
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
