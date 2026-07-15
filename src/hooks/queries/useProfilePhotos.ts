// -----------------------------------------------------------
// Mistella - プロフィール写真のクエリフック（両ロール共通）
// -----------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addProfilePhoto,
  deleteProfilePhoto,
  getProfilePhotos,
} from '@/services/photoService';
import { useAuthStore } from '@/store/authStore';

const photosKey = (userId: string) => ['profilePhotos', userId] as const;

/** 指定ユーザーのプロフィール写真一覧 */
export function useProfilePhotos(userId: string | undefined) {
  return useQuery({
    queryKey: photosKey(userId ?? ''),
    enabled: !!userId,
    queryFn: () => getProfilePhotos(userId!),
  });
}

/** 写真を追加する（自分の写真） */
export function useAddProfilePhoto() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ localUri, sortOrder }: { localUri: string; sortOrder: number }) =>
      addProfilePhoto(user!.id, localUri, sortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photosKey(user?.id ?? '') });
    },
  });
}

/** 写真を削除する（自分の写真） */
export function useDeleteProfilePhoto() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => deleteProfilePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photosKey(user?.id ?? '') });
    },
  });
}
