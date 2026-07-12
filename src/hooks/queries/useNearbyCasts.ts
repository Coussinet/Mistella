// -----------------------------------------------------------
// Mistella - マップ表示用キャストクエリフック
// -----------------------------------------------------------

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useRealtimeInvalidation } from '@/hooks/useRealtimeInvalidation';
import { getNearbyCastsForMap } from '@/services/castService';

/**
 * マップに表示するキャスト一覧。
 * cast_profiles の変更（出勤状態・位置情報など）をリアルタイムで反映する。
 */
export function useMapCasts(onlyWorking: boolean) {
  const query = useQuery({
    queryKey: queryKeys.casts.map(onlyWorking),
    queryFn: () => getNearbyCastsForMap(onlyWorking),
  });

  // 出勤中フィルタの ON/OFF どちらのキーも invalidate する
  useRealtimeInvalidation({
    channelName: 'cast_profiles_map',
    table: 'cast_profiles',
    invalidateKeys: [queryKeys.casts.mapAll()],
  });

  return query;
}
