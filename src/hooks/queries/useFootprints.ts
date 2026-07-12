// -----------------------------------------------------------
// Mistella - 足跡クエリフック
// -----------------------------------------------------------

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getFootprints } from '@/services/customerService';
import { useAuthStore } from '@/store/authStore';

/** 自分のプロフィールを見た人の一覧 */
export function useFootprints() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: queryKeys.footprints(user?.id ?? ''),
    enabled: !!user,
    queryFn: () => getFootprints(user!.id),
  });
}
