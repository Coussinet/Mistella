-- ============================================================
-- Mistella: DBマイグレーション 006
-- 目的: サンプルタイムライン投稿（女性キャスト10名 × 各1投稿）
-- ============================================================

INSERT INTO public.timelines (id, user_id, content, media_url, media_type, expires_at, created_at) VALUES
  (
    gen_random_uuid(),
    '11111111-0001-0001-0001-000000000001',
    '今日も銀座で出勤中です🌸 お仕事帰りにぜひ遊びに来てください♪ 待ってますよ〜！',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '1 hour'
  ),
  (
    gen_random_uuid(),
    '11111111-0002-0002-0002-000000000002',
    '六本木の夜は最高すぎる✨ お客様と盛り上がりすぎてもう終電逃しそう笑 今夜もまだまだ元気です！',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '2 hours'
  ),
  (
    gen_random_uuid(),
    '11111111-0003-0003-0003-000000000003',
    '今日は休みだったのでお菓子作りしました🍰 シュークリームが上手くできた！またお店で手作りお菓子持参するかも？',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '3 hours'
  ),
  (
    gen_random_uuid(),
    '11111111-0004-0004-0004-000000000004',
    '今夜も銀座でバリバリ働いてます💪 カラオケ大会したい人いませんか？🎤 歌うの大好きなので一緒に盛り上がりましょう！',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '90 minutes'
  ),
  (
    gen_random_uuid(),
    '11111111-0005-0005-0005-000000000005',
    '最近ハマってる本を読みながら出勤前の時間を過ごしてます📚 今日のおすすめ一冊は「夜は短し歩けよ乙女」。好きな本がある方と語り合いたいです！',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '4 hours'
  ),
  (
    gen_random_uuid(),
    '11111111-0006-0006-0006-000000000006',
    '先週の旅行の写真整理してたら赤坂の夜景にいい写真があった🌆 やっぱり東京の夜は綺麗だなあ。今夜も赤坂で働きます！',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '5 hours'
  ),
  (
    gen_random_uuid(),
    '11111111-0007-0007-0007-000000000007',
    '昨日のサッカー見た！？めちゃくちゃ興奮した⚽ スポーツ話ができる男性大歓迎です！今夜六本木で語りましょ！',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '30 minutes'
  ),
  (
    gen_random_uuid(),
    '11111111-0008-0008-0008-000000000008',
    '先日コンサートに行ってきました🎹 音楽を聴いた後はいつも気持ちがリセットされる感じがして好き。今夜も銀座でゆっくりお話しましょう♪',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '6 hours'
  ),
  (
    gen_random_uuid(),
    '11111111-0009-0009-0009-000000000009',
    '今日ランチで新しいお店発見した！新宿のイタリアン、パスタが絶品すぎてリピート確定です🍝 グルメな話ができる方ぜひ来てください！',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '2 hours'
  ),
  (
    gen_random_uuid(),
    '11111111-0010-0010-0010-000000000010',
    'ヨガをはじめて3ヶ月。少しずつ体が柔らかくなってきた🧘‍♀️ 癒しを求めている方、今夜渋谷でゆっくりお待ちしてます。',
    NULL, NULL,
    now() + interval '24 hours',
    now() - interval '3 hours'
  );
