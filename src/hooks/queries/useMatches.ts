// -----------------------------------------------------------
// Mistella - マッチクエリフック
// -----------------------------------------------------------

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useRealtimeInvalidation } from '@/hooks/useRealtimeInvalidation';
import { getMatches } from '@/services/matchService';
import { useAuthStore } from '@/store/authStore';

/** マッチ一覧（matches テーブルの変更をリアルタイム反映） */
export function useMatches() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const query = useQuery({
    queryKey: queryKeys.matches(user?.id ?? ''),
    enabled: !!user && !!profile,
    queryFn: () => getMatches(user!.id, profile!.role),
  });

  // マッチ成立・解除をリアルタイムで一覧に反映する
  useRealtimeInvalidation({
    channelName: `matches:${user?.id ?? 'anonymous'}`,
    table: 'matches',
    filter:
      profile?.role === 'cast'
        ? `cast_id=eq.${user?.id}`
        : `customer_id=eq.${user?.id}`,
    invalidateKeys: [queryKeys.matches(user?.id ?? '')],
    enabled: !!user && !!profile,
  });

  return query;
}
