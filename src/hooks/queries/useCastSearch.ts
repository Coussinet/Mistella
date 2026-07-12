// -----------------------------------------------------------
// Mistella - キャスト検索クエリフック（無限スクロール）
// -----------------------------------------------------------

import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { CAST_SEARCH_PAGE_SIZE, searchCasts } from '@/services/castService';
import type { CastSearchFilters } from '@/services/castService';

/** キャスト検索（ページサイズ20の無限スクロール） */
export function useCastSearch(filters: CastSearchFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.casts.search(filters),
    queryFn: ({ pageParam }) => searchCasts(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === CAST_SEARCH_PAGE_SIZE ? allPages.length : undefined,
  });
}
