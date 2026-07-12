// -----------------------------------------------------------
// Mistella - お気に入りクエリフック
// -----------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getCastProfilesByUserIds } from '@/services/castService';
import { getFavorites, removeFavorite } from '@/services/customerService';
import { useAuthStore } from '@/store/authStore';
import type { CastProfile, Favorite } from '@/types';

export interface FavoritesData {
  favorites: Favorite[];
  /** target_user_id → CastProfile */
  castProfileMap: Record<string, CastProfile>;
}

/** お気に入り一覧 + 対象キャストの出勤情報 */
export function useFavorites() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: queryKeys.favorites(user?.id ?? ''),
    enabled: !!user,
    queryFn: async (): Promise<FavoritesData> => {
      const favorites = await getFavorites(user!.id);
      const castIds = favorites
        .filter((f) => f.target_user?.role === 'cast')
        .map((f) => f.target_user_id);
      const castProfiles = await getCastProfilesByUserIds(castIds);
      const castProfileMap: Record<string, CastProfile> = {};
      for (const cp of castProfiles) {
        castProfileMap[cp.user_id] = cp;
      }
      return { favorites, castProfileMap };
    },
  });
}

/** お気に入り解除 */
export function useRemoveFavorite() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) => removeFavorite(user!.id, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites(user?.id ?? '') });
    },
  });
}
