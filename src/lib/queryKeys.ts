// -----------------------------------------------------------
// Mistella - React Query キーファクトリ
// クエリキーは必ずここから生成する（invalidate の対象指定を安全にするため）。
// -----------------------------------------------------------

export const queryKeys = {
  timelines: {
    all: ['timelines'] as const,
    list: () => ['timelines', 'list'] as const,
    mine: (userId: string) => ['timelines', 'mine', userId] as const,
  },
  casts: {
    all: ['casts'] as const,
    search: (filters: Record<string, unknown>) => ['casts', 'search', filters] as const,
    nearby: (lat: number, lng: number, radiusKm: number, onlyWorking: boolean) =>
      ['casts', 'nearby', { lat, lng, radiusKm, onlyWorking }] as const,
    /** マップ表示用（invalidate はプレフィックス mapAll を使う） */
    mapAll: () => ['casts', 'map'] as const,
    map: (onlyWorking: boolean) => ['casts', 'map', { onlyWorking }] as const,
    /** 今夜行ける！送信画面の現在地周辺キャスト（座標は queryFn 内で取得するためキーに含めない） */
    nearbyTonight: () => ['casts', 'nearbyTonight'] as const,
    detail: (userId: string) => ['casts', 'detail', userId] as const,
  },
  profile: (userId: string) => ['profile', userId] as const,
  customerProfile: (userId: string) => ['customerProfile', userId] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  favoriteStatus: (userId: string, targetUserId: string) =>
    ['favoriteStatus', userId, targetUserId] as const,
  footprints: (userId: string) => ['footprints', userId] as const,
  matches: (userId: string) => ['matches', userId] as const,
  messages: (matchId: string) => ['messages', matchId] as const,
  tonightRequests: {
    received: (castId: string) => ['tonightRequests', 'received', castId] as const,
    broadcast: (castId: string) => ['tonightRequests', 'broadcast', castId] as const,
  },
  notes: {
    list: (authorId: string) => ['notes', 'list', authorId] as const,
    detail: (authorId: string, partnerId: string) => ['notes', 'detail', authorId, partnerId] as const,
    reminders: (authorId: string) => ['notes', 'reminders', authorId] as const,
  },
  meetings: {
    list: (authorId: string, partnerId?: string) =>
      partnerId
        ? (['meetings', 'list', authorId, partnerId] as const)
        : (['meetings', 'list', authorId] as const),
  },
  notificationSettings: (userId: string) => ['notificationSettings', userId] as const,
  likedUsers: (userId: string) => ['likedUsers', userId] as const,
};
