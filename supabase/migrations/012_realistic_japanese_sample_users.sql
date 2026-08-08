-- ============================================================
-- Mistella: 日本人向けデモデータ刷新
-- 目的:
--   1. 旧連番IDのサンプルユーザーを削除
--   2. 架空の日本人プロフィールをキャスト30名・顧客30名登録
--   3. 画面確認用のタイムライン投稿を登録
--
-- 注意: 氏名・プロフィールはすべて架空です。実在人物の情報は含みません。
--       auth.users は作成しないため、一覧・検索等の表示確認専用です。
-- ============================================================

-- 旧サンプル専用のUUID名前空間だけを削除する。
-- 関連するタイムライン等は外部キーの ON DELETE CASCADE で整理される。
DELETE FROM public.users
WHERE id::text LIKE '11111111-%'
   OR id::text LIKE '22222222-%';

-- -----------------------------------------------------------------------------
-- 基本プロフィール: キャスト（女性）30名
-- アバターは実在人物の写真を避け、seed固定のイラストを使用する。
-- -----------------------------------------------------------------------------
INSERT INTO public.users
  (id, role, nickname, avatar_url, bio, is_premium, is_blocked)
VALUES
  ('052eef72-d746-48e7-9363-b4d57bb680f1', 'cast', '美咲', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=misaki-tachibana', '銀座で働いています。カフェと美術館巡りが好きです。落ち着いてお話ししましょう。', true, false),
  ('3b00328f-b00d-4fdb-bd34-412e6293ebbc', 'cast', '結衣', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=yui-morita', 'よく笑うと言われます。映画と韓国料理の話ならずっとできます。', false, false),
  ('bd7523ae-5484-4e70-852e-b03310a6a66e', 'cast', '彩花', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=ayaka-shimizu', 'ワインと旅行が好きです。初めましての方も気軽に声をかけてください。', false, false),
  ('de7a13ee-1165-428c-9380-af159626c3db', 'cast', '凛', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=rin-aoyama', '六本木勤務です。音楽とスポーツ観戦が好きな聞き上手です。', true, false),
  ('d50839f3-1eb8-4c96-bb6f-09cb94d3eff6', 'cast', '麻衣', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=mai-kobayashi', '休日はパン屋さん巡り。のんびりした時間を一緒に過ごせたら嬉しいです。', false, false),
  ('dd666b72-43a5-42bd-a1d5-687c038e497a', 'cast', '琴音', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=kotone-nakamura', 'ピアノとカラオケが得意です。音楽好きな方とお会いしたいです。', false, false),
  ('ddb8474f-8fcb-43db-9384-5b7e8d9d69be', 'cast', '七海', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=nanami-ishii', '新しいお店を探すのが趣味です。おすすめグルメを教えてください。', false, false),
  ('01f85ed7-513d-4cc3-b327-7623ee148461', 'cast', '莉子', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=riko-fujita', '明るく自然体な接客を心がけています。野球観戦も大好きです。', false, false),
  ('f8ce2c78-a2d1-40ff-9041-c679b2008612', 'cast', '遥', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=haruka-okada', '読書と温泉旅行が好きです。ゆっくりお話ししたい方、大歓迎です。', true, false),
  ('2d8c7144-6e42-46c3-ba15-d2241b9d217c', 'cast', '千尋', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=chihiro-saito', 'お酒は強くありませんが、おしゃべりは大好きです。', false, false),
  ('c1728007-6e40-4f06-a3ac-fabdda157438', 'cast', '杏奈', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=anna-hayashi', 'ダンスと洋楽が好きです。楽しく元気な時間をお届けします。', false, false),
  ('c608266a-d86a-4e44-9c45-a8065ec09a08', 'cast', '真帆', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=maho-endo', '日本酒を勉強中です。食事やお酒のお話で盛り上がりましょう。', false, false),
  ('6547b5a1-9191-4c0f-83cd-81920d77220e', 'cast', '紗季', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=saki-matsuda', '恵比寿で働いています。犬と散歩する時間が癒やしです。', false, false),
  ('8e7d1b83-6988-4c93-bf87-38d4603d027f', 'cast', '菜月', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=natsuki-yamamoto', '旅行の計画を立てるのが好きです。国内のおすすめを交換しましょう。', false, false),
  ('2753a995-f69c-43b1-928e-091f4311964e', 'cast', '優奈', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=yuna-inoue', '料理とヨガが趣味です。居心地のよい時間を大切にしています。', true, false),
  ('269d4ffa-f91d-4a97-84a0-88de21551f7e', 'cast', '楓', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=kaede-kondo', '関西出身です。よく笑って、よく話します。', false, false),
  ('31b69d4c-721a-4d5a-a737-1c8bf9d464fb', 'cast', '桃香', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=momoka-hasegawa', '写真とカフェ巡りが好きです。最近はフィルムカメラに夢中です。', false, false),
  ('f4e0b085-4e36-4ab2-8cd8-342b71b70c29', 'cast', 'ひかり', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=hikari-ishikawa', '初対面でも話しやすいと言われます。休日は映画館にいます。', false, false),
  ('fba2ae41-e291-4441-96a8-4705c62a9648', 'cast', '明日香', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=asuka-maeda', 'ゴルフを始めたばかりです。上達のコツを教えてください。', false, false),
  ('12a96e1b-8276-4e10-90c4-303aaf65c8d1', 'cast', '沙羅', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=sara-ueda', 'アートとファッションが好きです。穏やかな接客を心がけています。', true, false),
  ('c54d320e-7287-462b-a49b-8bf54e179588', 'cast', '葵', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=aoi-takagi', '福岡出身です。おいしいものと楽しい会話が元気の源です。', false, false),
  ('c37942ef-d161-4443-8881-39ef22c64b53', 'cast', '玲奈', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=reina-miyazaki', 'クラシック音楽と紅茶が好きです。静かな夜も賑やかな夜も歓迎です。', false, false),
  ('3101c235-ee5f-4116-acbf-a6ab722ac40b', 'cast', '瑞希', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=mizuki-nakajima', 'ゲームと漫画に詳しいです。共通の趣味が見つかると嬉しいです。', false, false),
  ('573967d8-beb0-46bc-86ac-9abe599a3686', 'cast', '愛莉', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=airi-fukuda', '海とドライブが好きです。明るく丁寧な時間をお届けします。', false, false),
  ('beefbfd8-b590-4004-aeb9-9ea327fe3927', 'cast', '若菜', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=wakana-ogawa', '和食と日本酒が好きです。季節のおいしいものを語りましょう。', false, false),
  ('029f0096-892c-4e05-ae4d-7483641a5b39', 'cast', '絵里', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=eri-nishimura', '美容と旅行の情報交換が好きです。気取らず話せるタイプです。', true, false),
  ('95fc4127-5564-413b-a327-683be6634d5a', 'cast', '奈緒', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=nao-murakami', 'ライブに行くのが趣味です。邦ロック好きな方ぜひ。', false, false),
  ('8e687609-9356-4a07-8b9a-04baebd2c819', 'cast', '亜美', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=ami-tanaka', 'おっとりしていると言われます。聞くことも話すことも好きです。', false, false),
  ('588b9119-12ef-4690-865c-5609f5318428', 'cast', '由佳', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=yuka-sugiyama', 'スポーツ観戦とサウナが趣味です。一日の終わりを楽しく過ごしましょう。', false, false),
  ('0da1d02e-f434-4071-ac5a-e0cb333a1249', 'cast', '小春', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=koharu-kikuchi', '甘いものと猫が大好きです。初めての方にも安心していただける接客を目指しています。', false, false)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  nickname = EXCLUDED.nickname,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  is_premium = EXCLUDED.is_premium,
  is_blocked = false;

-- アプリに同梱した架空の日本人女性ポートレートへ割り当てる。
-- カスタムURIは src/constants/demoAvatars.ts でバンドル画像に解決される。
UPDATE public.users AS users
SET avatar_url = demo.avatar_uri
FROM (VALUES
  ('052eef72-d746-48e7-9363-b4d57bb680f1'::uuid, 'mistella-demo://cast/01'),
  ('3b00328f-b00d-4fdb-bd34-412e6293ebbc'::uuid, 'mistella-demo://cast/02'),
  ('bd7523ae-5484-4e70-852e-b03310a6a66e'::uuid, 'mistella-demo://cast/03'),
  ('de7a13ee-1165-428c-9380-af159626c3db'::uuid, 'mistella-demo://cast/04'),
  ('d50839f3-1eb8-4c96-bb6f-09cb94d3eff6'::uuid, 'mistella-demo://cast/05'),
  ('dd666b72-43a5-42bd-a1d5-687c038e497a'::uuid, 'mistella-demo://cast/06'),
  ('ddb8474f-8fcb-43db-9384-5b7e8d9d69be'::uuid, 'mistella-demo://cast/07'),
  ('01f85ed7-513d-4cc3-b327-7623ee148461'::uuid, 'mistella-demo://cast/08'),
  ('f8ce2c78-a2d1-40ff-9041-c679b2008612'::uuid, 'mistella-demo://cast/09'),
  ('2d8c7144-6e42-46c3-ba15-d2241b9d217c'::uuid, 'mistella-demo://cast/10'),
  ('c1728007-6e40-4f06-a3ac-fabdda157438'::uuid, 'mistella-demo://cast/11'),
  ('c608266a-d86a-4e44-9c45-a8065ec09a08'::uuid, 'mistella-demo://cast/12'),
  ('6547b5a1-9191-4c0f-83cd-81920d77220e'::uuid, 'mistella-demo://cast/13'),
  ('8e7d1b83-6988-4c93-bf87-38d4603d027f'::uuid, 'mistella-demo://cast/14'),
  ('2753a995-f69c-43b1-928e-091f4311964e'::uuid, 'mistella-demo://cast/15'),
  ('269d4ffa-f91d-4a97-84a0-88de21551f7e'::uuid, 'mistella-demo://cast/16'),
  ('31b69d4c-721a-4d5a-a737-1c8bf9d464fb'::uuid, 'mistella-demo://cast/17'),
  ('f4e0b085-4e36-4ab2-8cd8-342b71b70c29'::uuid, 'mistella-demo://cast/18'),
  ('fba2ae41-e291-4441-96a8-4705c62a9648'::uuid, 'mistella-demo://cast/19'),
  ('12a96e1b-8276-4e10-90c4-303aaf65c8d1'::uuid, 'mistella-demo://cast/20'),
  ('c54d320e-7287-462b-a49b-8bf54e179588'::uuid, 'mistella-demo://cast/21'),
  ('c37942ef-d161-4443-8881-39ef22c64b53'::uuid, 'mistella-demo://cast/22'),
  ('3101c235-ee5f-4116-acbf-a6ab722ac40b'::uuid, 'mistella-demo://cast/23'),
  ('573967d8-beb0-46bc-86ac-9abe599a3686'::uuid, 'mistella-demo://cast/24'),
  ('beefbfd8-b590-4004-aeb9-9ea327fe3927'::uuid, 'mistella-demo://cast/25'),
  ('029f0096-892c-4e05-ae4d-7483641a5b39'::uuid, 'mistella-demo://cast/26'),
  ('95fc4127-5564-413b-a327-683be6634d5a'::uuid, 'mistella-demo://cast/27'),
  ('8e687609-9356-4a07-8b9a-04baebd2c819'::uuid, 'mistella-demo://cast/28'),
  ('588b9119-12ef-4690-865c-5609f5318428'::uuid, 'mistella-demo://cast/29'),
  ('0da1d02e-f434-4071-ac5a-e0cb333a1249'::uuid, 'mistella-demo://cast/30')
) AS demo(user_id, avatar_uri)
WHERE users.id = demo.user_id;

-- -----------------------------------------------------------------------------
-- 基本プロフィール: 顧客（男性）30名
-- -----------------------------------------------------------------------------
INSERT INTO public.users
  (id, role, nickname, avatar_url, bio, is_premium, is_blocked)
VALUES
  ('fe7c16ab-89d9-4f35-be23-37adc30582f3', 'customer', '拓海', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=takumi-sato', '都内勤務です。休日はゴルフか温泉に出かけています。', true, false),
  ('1da3a0bb-562b-438a-a29d-7bc64c9e7d65', 'customer', '健太', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=kenta-suzuki', '仕事帰りにゆっくり飲むのが好きです。', false, false),
  ('dbfb3786-7c6a-46f6-b4ea-c8948e4f4dab', 'customer', '直樹', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=naoki-takahashi', 'IT関係の仕事をしています。映画と音楽が好きです。', false, false),
  ('96b0e43b-32e9-463c-8fbb-dd0e4cca56f5', 'customer', '翔太', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=shota-ito', '野球観戦とおいしい焼き鳥屋巡りが趣味です。', false, false),
  ('17e4c2a4-69a8-42f8-a339-9b57be9462f7', 'customer', '大輔', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=daisuke-watanabe', '出張が多い会社員です。各地のおいしい店を探しています。', false, false),
  ('dc75084d-f3e7-41bf-a814-c0c042a0205e', 'customer', '亮介', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=ryosuke-yamashita', '休日はドライブと写真撮影を楽しんでいます。', true, false),
  ('7a2d6ffb-4ff3-427b-8bf0-d31791ec9755', 'customer', '雄太', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=yuta-nakamura', '飲食関係の仕事です。ワインを勉強しています。', false, false),
  ('ba105a0e-0ab4-449d-8317-207f1c320eb6', 'customer', '和也', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=kazuya-kobayashi', 'サッカーと筋トレが好きです。楽しく飲みましょう。', false, false),
  ('39b66b2a-408b-48ee-a90d-9255087d15d5', 'customer', '誠', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=makoto-kato', '建築関係です。美術館や街歩きによく出かけます。', false, false),
  ('2fa5b6f3-7988-491d-9f33-242f527c1e9e', 'customer', '優斗', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=yuto-yoshida', '音楽フェスとキャンプが好きです。', false, false),
  ('7d0eec74-80fc-4227-83e7-e5edfbf672b6', 'customer', '浩平', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=kohei-yamada', '金融関係の仕事です。休日はゴルフをしています。', true, false),
  ('cd51db9f-6b26-4e7c-bd63-3bcd632193f4', 'customer', '達也', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=tatsuya-sasaki', '料理と日本酒が好きです。気軽に話せる方と出会いたいです。', false, false),
  ('a9c320da-064f-45ba-9c5e-1c4d242f113c', 'customer', '智也', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=tomoya-yamaguchi', '旅行会社勤務です。国内旅行の相談ならお任せください。', false, false),
  ('ec12755b-ad4f-4168-b84a-755b07c2b9ae', 'customer', '慎一', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=shinichi-matsumoto', 'メーカー勤務です。ウイスキーと読書が好きです。', false, false),
  ('589c2c59-5428-4189-bb35-35fc2b1917a3', 'customer', '晃', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=akira-inoue', '広告関係の仕事です。新しいお店を見つけるのが趣味です。', false, false),
  ('0d40a3ae-300a-4574-9c03-6c06d7e8d4a5', 'customer', '康平', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=kohei-kimura', '大阪出身です。東京のおいしい店を開拓中です。', false, false),
  ('7574235f-e637-42a5-8a0a-9628d5fbd2f9', 'customer', '雅人', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=masato-hayashi', '医療関係です。休日はテニスで体を動かしています。', true, false),
  ('4015eaac-48a5-4d1c-8940-5dbc387e86a5', 'customer', '悠真', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=yuma-shimizu', 'ゲーム制作の仕事をしています。漫画と映画が好きです。', false, false),
  ('d1189c54-2b95-4c00-b8b6-dcd10f13c123', 'customer', '哲也', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=tetsuya-endo', '不動産関係です。落ち着いたお店を好みます。', false, false),
  ('57735505-06a0-4cdc-9c76-377dc671bf20', 'customer', '一樹', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=kazuki-fujii', '商社勤務です。出張先で食べ歩くのが楽しみです。', false, false),
  ('8552eb81-e42a-42b9-93ef-2ddd9d8892e1', 'customer', '亮太', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=ryota-okamoto', '音楽とサウナが好きです。休日はライブにも行きます。', false, false),
  ('5439f384-c719-4d02-a486-69772bf11c8d', 'customer', '圭介', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=keisuke-mori', '法律関係の仕事です。ワインと美術が好きです。', true, false),
  ('1e3c3064-00bc-4eee-99ae-a24c156ac156', 'customer', '信也', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=shinya-ikeda', '福岡と東京を行き来しています。食事と会話を楽しみたいです。', false, false),
  ('b0b7ab81-3215-4521-9a8c-9ab505df19a9', 'customer', '航', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=wataru-hashimoto', 'スポーツ用品関係です。マラソンと野球が好きです。', false, false),
  ('935879bd-ef6f-4e94-9307-e208ae96b51e', 'customer', '英樹', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=hideki-ishida', '経営コンサルタントです。静かに飲める場所を探しています。', false, false),
  ('9a924d61-376f-4981-9d49-eda995f72037', 'customer', '駿', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=shun-maeda', 'アパレル関係です。写真とファッションが趣味です。', false, false),
  ('64701832-d952-4b07-b2f9-b6509892da12', 'customer', '隆之', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=takayuki-ogawa', '自営業です。ゴルフと温泉旅行が好きです。', true, false),
  ('1aa678e5-b890-4f4d-bffa-fb4d9078e97d', 'customer', '健介', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=kensuke-nishida', '出版社勤務です。本と映画について話せると嬉しいです。', false, false),
  ('8092dcba-a04d-4cb0-a988-ed4a2b477921', 'customer', '修平', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=shuhei-taniguchi', '食品メーカー勤務です。食べ歩きと料理が趣味です。', false, false),
  ('bcdf0d1a-c872-4ca7-a460-7e26aabac806', 'customer', '貴大', 'https://api.dicebear.com/9.x/notionists-neutral/png?seed=takahiro-kawaguchi', 'エンジニアです。旅行とカメラを楽しんでいます。', false, false)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  nickname = EXCLUDED.nickname,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  is_premium = EXCLUDED.is_premium,
  is_blocked = false;

-- -----------------------------------------------------------------------------
-- キャスト詳細プロフィール（30名）
-- -----------------------------------------------------------------------------
INSERT INTO public.cast_profiles
  (user_id, shop_name, shop_address, price_info, is_sponsored, is_working,
   work_status, location_lat, location_lng, location_enabled, age, height,
   blood_type, hobbies, personality, charm_point, favorite_drink,
   service_style, favorite_topics, activities, customer_message, hometown,
   drink_strength, favorite_song, body_style)
VALUES
  ('052eef72-d746-48e7-9363-b4d57bb680f1', 'CLUB TSUKI', '東京都中央区銀座', '60分 15,000円〜', true, true, 'working', 35.6717, 139.7649, true, 25, 160, 'A', '美術館・カフェ', '穏やかで聞き上手', '自然な笑顔', '白ワイン', '落ち着いた会話', '旅行・アート', 'ワインを楽しむ', '初めての方も気軽にどうぞ。', '神奈川県', '普通', 'First Love', 'やや細身'),
  ('3b00328f-b00d-4fdb-bd34-412e6293ebbc', 'Lounge AO', '東京都港区六本木', '60分 12,000円〜', false, true, 'working', 35.6628, 139.7317, true, 23, 157, 'O', '映画・韓国料理', '明るく親しみやすい', 'よく笑うところ', 'レモンサワー', '楽しく自然体', '映画・グルメ', 'カラオケ', '一緒にたくさん笑いましょう。', '東京都', '高め', 'Subtitle', '普通'),
  ('bd7523ae-5484-4e70-852e-b03310a6a66e', 'GINZA LILAS', '東京都中央区銀座', '70分 18,000円〜', false, false, 'off', NULL, NULL, false, 27, 163, 'B', '旅行・ワイン', '大人っぽくマイペース', '話題の豊富さ', '赤ワイン', '丁寧で上品', '海外旅行・食事', '食事同伴', '心地よい夜をご一緒できたら嬉しいです。', '兵庫県', '普通', 'やさしさで溢れるように', 'スリム'),
  ('de7a13ee-1165-428c-9380-af159626c3db', 'ROPPONGI 凛', '東京都港区六本木', '60分 16,000円〜', true, true, 'working', 35.6637, 139.7324, true, 26, 165, 'AB', '音楽・スポーツ観戦', 'さっぱりして誠実', '聞き上手', 'シャンパン', 'テンポのよい会話', '音楽・野球', 'スポーツ観戦', '気取らず楽しい時間にしましょう。', '北海道', '高め', '丸の内サディスティック', 'やや細身'),
  ('d50839f3-1eb8-4c96-bb6f-09cb94d3eff6', 'Salon M', '東京都渋谷区恵比寿', '60分 11,000円〜', false, true, 'break', 35.6468, 139.7102, false, 24, 158, 'A', 'パン屋巡り・散歩', 'おっとり穏やか', '安心感', '梅酒', 'ゆったり聞き役', '日常・ペット', 'カフェ巡り', 'ゆっくりお話ししましょう。', '埼玉県', '弱い', 'アイノカタチ', '普通'),
  ('dd666b72-43a5-42bd-a1d5-687c038e497a', 'Lounge NOTE', '東京都港区赤坂', '60分 13,000円〜', false, true, 'working', 35.6769, 139.7361, true, 25, 161, 'A', 'ピアノ・カラオケ', '上品で好奇心旺盛', 'きれいな声', 'カクテル', '会話と音楽', '音楽・舞台', 'カラオケ', '音楽好きの方、お待ちしています。', '長野県', '普通', '366日', 'やや細身'),
  ('ddb8474f-8fcb-43db-9384-5b7e8d9d69be', 'AZABU NANA', '東京都港区麻布十番', '60分 14,000円〜', false, false, 'off', NULL, NULL, false, 28, 159, 'B', 'グルメ・料理', '気配り上手', 'お店選び', '日本酒', '丁寧で家庭的', '料理・旅行', '食べ歩き', 'おすすめのお店を教えてください。', '京都府', '普通', '花束を君に', '普通'),
  ('01f85ed7-513d-4cc3-b327-7623ee148461', 'Club ORI', '東京都新宿区歌舞伎町', '50分 10,000円〜', false, true, 'working', 35.6945, 139.7039, true, 22, 156, 'O', '野球・スニーカー', '明るく素直', '元気な笑顔', 'ハイボール', 'フレンドリー', 'スポーツ・音楽', '野球観戦', '仕事帰りに元気を補給しに来てください。', '千葉県', '高め', '水平線', '普通'),
  ('f8ce2c78-a2d1-40ff-9041-c679b2008612', '銀座 遥', '東京都中央区銀座', '60分 17,000円〜', true, true, 'working', 35.6709, 139.7633, true, 29, 164, 'A', '読書・温泉', '知的で落ち着いている', '言葉遣い', 'ウイスキー', '静かで上質', '本・温泉・仕事', 'バー巡り', '一日の終わりにくつろいでください。', '石川県', '普通', '糸', 'スリム'),
  ('2d8c7144-6e42-46c3-ba15-d2241b9d217c', 'EBISU C', '東京都渋谷区恵比寿', '60分 12,000円〜', false, false, 'off', NULL, NULL, false, 24, 155, 'AB', 'お菓子作り・ドラマ', '控えめで優しい', '柔らかな雰囲気', 'ノンアルコール', '聞き役中心', 'ドラマ・料理', 'カフェ', 'お酒が苦手な方も歓迎です。', '静岡県', '飲めない', '恋人ごっこ', '普通'),
  ('c1728007-6e40-4f06-a3ac-fabdda157438', 'Club VIVI', '東京都新宿区歌舞伎町', '50分 11,000円〜', false, true, 'working', 35.6951, 139.7047, true, 23, 162, 'B', 'ダンス・洋楽', '元気で社交的', '盛り上げ上手', 'テキーラ', '明るくアクティブ', '音楽・海外', 'ダンス・カラオケ', '楽しい夜にしましょう。', '愛知県', '酒豪', '怪獣の花唄', 'やや細身'),
  ('c608266a-d86a-4e44-9c45-a8065ec09a08', '赤坂 Mellow', '東京都港区赤坂', '60分 13,000円〜', false, true, 'break', 35.6759, 139.7353, false, 30, 160, 'O', '日本酒・和食', '落ち着いて面倒見がよい', 'お酒の知識', '日本酒', '大人の会話', '食・経営・旅行', '和食巡り', 'お好みに合う一杯を一緒に探します。', '新潟県', '高め', 'Everything', '普通'),
  ('6547b5a1-9191-4c0f-83cd-81920d77220e', 'Lounge SAKI', '東京都渋谷区恵比寿', '60分 12,000円〜', false, true, 'working', 35.6474, 139.7094, true, 25, 158, 'A', '犬・散歩・カフェ', '親しみやすく素直', '癒やしの笑顔', 'カシスオレンジ', '自然体', 'ペット・カフェ', '散歩・カフェ', '肩の力を抜いて過ごしましょう。', '東京都', '弱い', 'ハルノヒ', '普通'),
  ('8e7d1b83-6988-4c93-bf87-38d4603d027f', '渋谷 N', '東京都渋谷区道玄坂', '60分 10,000円〜', false, false, 'off', NULL, NULL, false, 26, 161, 'B', '旅行・語学', '好奇心旺盛', '旅の話', 'ビール', '会話を楽しむ', '国内旅行・語学', '旅行計画', '次に行きたい場所を一緒に考えましょう。', '福岡県', '普通', '新時代', 'やや細身'),
  ('2753a995-f69c-43b1-928e-091f4311964e', 'GINZA YUNA', '東京都中央区銀座', '60分 16,000円〜', true, true, 'working', 35.6728, 139.7660, true, 27, 166, 'A', '料理・ヨガ', '丁寧で包容力がある', '姿勢と笑顔', 'シャンパン', '上品で穏やか', '美容・健康・料理', '食事・ヨガ', '心地よい時間を大切にします。', '大阪府', '普通', 'Story', 'スリム'),
  ('269d4ffa-f91d-4a97-84a0-88de21551f7e', 'Lounge KAEDE', '東京都新宿区歌舞伎町', '50分 10,000円〜', false, true, 'working', 35.6938, 139.7041, true, 24, 159, 'O', 'お笑い・料理', '明るくテンポがよい', '関西弁', 'レモンサワー', '楽しく賑やか', 'お笑い・グルメ', 'カラオケ', '笑って一日を締めくくりましょう。', '大阪府', '高め', '大阪LOVER', '普通'),
  ('31b69d4c-721a-4d5a-a737-1c8bf9d464fb', '代官山 MOMO', '東京都渋谷区代官山町', '60分 12,000円〜', false, false, 'off', NULL, NULL, false, 23, 157, 'AB', '写真・カフェ', '感性豊かでマイペース', '写真センス', '紅茶', '穏やかで自然体', '写真・ファッション', '撮影・カフェ', '素敵な景色の話を聞かせてください。', '山梨県', '弱い', 'カタオモイ', 'やや細身'),
  ('f4e0b085-4e36-4ab2-8cd8-342b71b70c29', '青山 HIKARI', '東京都港区南青山', '60分 15,000円〜', false, true, 'working', 35.6652, 139.7124, true, 27, 163, 'A', '映画・ランニング', '話しやすく誠実', '距離感の上手さ', '白ワイン', '丁寧で自然体', '映画・健康', '映画鑑賞', '初めましてでも安心してお話しください。', '宮城県', '普通', '点描の唄', 'スリム'),
  ('fba2ae41-e291-4441-96a8-4705c62a9648', 'GINZA ASUKA', '東京都中央区銀座', '60分 15,000円〜', false, true, 'break', 35.6712, 139.7670, false, 28, 164, 'B', 'ゴルフ・美容', '前向きで負けず嫌い', '明るいリアクション', 'ハイボール', '会話重視', 'ゴルフ・美容', 'ゴルフ練習', 'ゴルフのお話をたくさん聞きたいです。', '広島県', '高め', 'Mela!', 'やや細身'),
  ('12a96e1b-8276-4e10-90c4-303aaf65c8d1', '六本木 SARA', '東京都港区六本木', '70分 18,000円〜', true, true, 'working', 35.6619, 139.7309, true, 30, 167, 'AB', 'アート・ファッション', '上品で落ち着いている', '所作', 'シャンパン', '静かで上質', 'アート・海外・経営', 'ギャラリー巡り', '特別な夜を丁寧にお手伝いします。', '東京都', '普通', '接吻', 'スリム'),
  ('c54d320e-7287-462b-a49b-8bf54e179588', 'Lounge AOI', '東京都港区赤坂', '60分 12,000円〜', false, true, 'working', 35.6775, 139.7368, true, 25, 158, 'O', 'グルメ・旅行', '明るく気配り上手', '博多弁', '焼酎', '親しみやすい', '食・旅行', '食べ歩き', '楽しくおいしい話をしましょう。', '福岡県', '高め', '家族になろうよ', '普通'),
  ('c37942ef-d161-4443-8881-39ef22c64b53', '銀座 REINA', '東京都中央区銀座', '60分 17,000円〜', false, false, 'off', NULL, NULL, false, 29, 165, 'A', 'クラシック・紅茶', '知的で穏やか', '丁寧な会話', '紅茶', '落ち着いた聞き役', '音楽・本・仕事', 'コンサート', '静かな会話がお好きな方も歓迎です。', '京都府', '飲めない', '愛をこめて花束を', 'やや細身'),
  ('3101c235-ee5f-4116-acbf-a6ab722ac40b', 'AKASAKA MIZUKI', '東京都港区赤坂', '60分 11,000円〜', false, true, 'working', 35.6749, 139.7345, true, 22, 156, 'B', 'ゲーム・漫画', '素直で好奇心旺盛', '趣味の幅広さ', 'カルーアミルク', '楽しくフレンドリー', 'ゲーム・アニメ', 'ゲーム・カラオケ', '好きな作品の話で盛り上がりましょう。', '埼玉県', '弱い', '青と夏', '普通'),
  ('573967d8-beb0-46bc-86ac-9abe599a3686', 'Lounge AIRI', '東京都渋谷区恵比寿', '60分 12,000円〜', false, true, 'break', 35.6459, 139.7087, false, 26, 162, 'O', '海・ドライブ', '明るく丁寧', 'ポジティブさ', 'ビール', '自然体で親しみやすい', '旅行・ドライブ', 'ドライブ・食事', '一緒に楽しい予定を作りましょう。', '沖縄県', '普通', '366日', '普通'),
  ('beefbfd8-b590-4004-aeb9-9ea327fe3927', 'GINZA WAKANA', '東京都中央区銀座', '60分 16,000円〜', false, true, 'working', 35.6733, 139.7654, true, 31, 161, 'A', '和食・日本酒', '落ち着いて気が利く', '季節の知識', '日本酒', '大人の会話', '食・旅行・文化', '和食巡り', '季節のお話をしながら一杯どうぞ。', '秋田県', '高め', '楓', '普通'),
  ('029f0096-892c-4e05-ae4d-7483641a5b39', '六本木 ERI', '東京都港区六本木', '60分 15,000円〜', true, true, 'working', 35.6642, 139.7330, true, 28, 163, 'AB', '美容・海外旅行', '社交的でさっぱり', '情報の早さ', 'シャンパン', '華やかで丁寧', '美容・旅行・仕事', 'ショッピング', '新しい発見のある夜にしましょう。', '愛知県', '高め', '君はロックを聴かない', 'スリム'),
  ('95fc4127-5564-413b-a327-683be6634d5a', 'SHINJUKU NAO', '東京都新宿区歌舞伎町', '50分 10,000円〜', false, false, 'off', NULL, NULL, false, 24, 160, 'B', 'ライブ・邦ロック', '明るくマイペース', '音楽の話', 'ジントニック', 'フレンドリー', '音楽・フェス', 'ライブ・カラオケ', '好きな曲をぜひ教えてください。', '群馬県', '普通', '高嶺の花子さん', '普通'),
  ('8e687609-9356-4a07-8b9a-04baebd2c819', 'Salon AMI', '東京都渋谷区恵比寿', '60分 11,000円〜', false, true, 'break', 35.6479, 139.7111, false, 27, 157, 'A', 'カフェ・ドラマ', 'おっとり聞き上手', '柔らかな声', '梅酒', '癒やし系', 'ドラマ・日常', 'カフェ', 'ゆっくりしたい夜に会いに来てください。', '栃木県', '弱い', '裸の心', '普通'),
  ('588b9119-12ef-4690-865c-5609f5318428', 'AKASAKA YUKA', '東京都港区赤坂', '60分 13,000円〜', false, true, 'working', 35.6761, 139.7374, true, 29, 164, 'O', 'スポーツ・サウナ', '元気で行動的', '健康的な笑顔', 'ハイボール', '明るくテンポよく', 'スポーツ・健康', 'スポーツ観戦', '一日の終わりを元気に締めましょう。', '北海道', '高め', '栄光の架橋', 'やや細身'),
  ('0da1d02e-f434-4071-ac5a-e0cb333a1249', 'GINZA KOHARU', '東京都中央区銀座', '60分 14,000円〜', false, false, 'off', NULL, NULL, false, 23, 155, 'AB', '猫・スイーツ', '優しく人懐っこい', '安心感', 'いちごミルク', '丁寧で親しみやすい', 'ペット・スイーツ', 'カフェ巡り', '初めての方にも安心していただけるよう心がけています。', '千葉県', '弱い', '猫', '普通')
ON CONFLICT (user_id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  shop_address = EXCLUDED.shop_address,
  price_info = EXCLUDED.price_info,
  is_sponsored = EXCLUDED.is_sponsored,
  is_working = EXCLUDED.is_working,
  work_status = EXCLUDED.work_status,
  location_lat = EXCLUDED.location_lat,
  location_lng = EXCLUDED.location_lng,
  location_enabled = EXCLUDED.location_enabled,
  age = EXCLUDED.age,
  height = EXCLUDED.height,
  blood_type = EXCLUDED.blood_type,
  hobbies = EXCLUDED.hobbies,
  personality = EXCLUDED.personality,
  charm_point = EXCLUDED.charm_point,
  favorite_drink = EXCLUDED.favorite_drink,
  service_style = EXCLUDED.service_style,
  favorite_topics = EXCLUDED.favorite_topics,
  activities = EXCLUDED.activities,
  customer_message = EXCLUDED.customer_message,
  hometown = EXCLUDED.hometown,
  drink_strength = EXCLUDED.drink_strength,
  favorite_song = EXCLUDED.favorite_song,
  body_style = EXCLUDED.body_style;

-- -----------------------------------------------------------------------------
-- 顧客詳細プロフィール（30名）
-- -----------------------------------------------------------------------------
INSERT INTO public.customer_profiles
  (user_id, age, occupation, annual_income, hobbies, preferred_area, appeal_message)
VALUES
  ('fe7c16ab-89d9-4f35-be23-37adc30582f3', 38, '総合商社', '800〜1,000万円', 'ゴルフ・温泉', '銀座・赤坂', '落ち着いて話せる方と出会えたら嬉しいです。'),
  ('1da3a0bb-562b-438a-a29d-7bc64c9e7d65', 32, 'メーカー営業', '500〜800万円', '居酒屋巡り・映画', '新宿・恵比寿', '仕事帰りに楽しく飲みましょう。'),
  ('dbfb3786-7c6a-46f6-b4ea-c8948e4f4dab', 35, 'IT企業', '800〜1,000万円', '映画・音楽・ガジェット', '渋谷・恵比寿', '気取らず話せる関係が理想です。'),
  ('96b0e43b-32e9-463c-8fbb-dd0e4cca56f5', 29, '広告代理店', '500〜800万円', '野球・焼き鳥', '新宿・六本木', 'スポーツ好きな方と盛り上がりたいです。'),
  ('17e4c2a4-69a8-42f8-a339-9b57be9462f7', 41, '製薬会社', '800〜1,000万円', '出張・食べ歩き', '銀座・赤坂', 'おすすめのお店を一緒に開拓しましょう。'),
  ('dc75084d-f3e7-41bf-a814-c0c042a0205e', 36, '映像制作', '500〜800万円', 'ドライブ・写真', '恵比寿・代官山', '写真や旅行の話が好きです。'),
  ('7a2d6ffb-4ff3-427b-8bf0-d31791ec9755', 34, '飲食店経営', '1,000万円以上', 'ワイン・料理', '銀座・恵比寿', '食事と会話をゆっくり楽しみたいです。'),
  ('ba105a0e-0ab4-449d-8317-207f1c320eb6', 31, 'スポーツ関連', '500〜800万円', 'サッカー・筋トレ', '六本木・青山', '明るく楽しい時間を過ごしましょう。'),
  ('39b66b2a-408b-48ee-a90d-9255087d15d5', 40, '建築士', '800〜1,000万円', '建築・美術館', '青山・銀座', 'アートや街の話ができると嬉しいです。'),
  ('2fa5b6f3-7988-491d-9f33-242f527c1e9e', 28, 'イベント会社', '500〜800万円', '音楽フェス・キャンプ', '渋谷・新宿', '音楽好きな方と出会いたいです。'),
  ('7d0eec74-80fc-4227-83e7-e5edfbf672b6', 43, '金融機関', '1,000万円以上', 'ゴルフ・旅行', '銀座・六本木', '落ち着いた大人の時間を希望しています。'),
  ('cd51db9f-6b26-4e7c-bd63-3bcd632193f4', 37, '食品会社', '500〜800万円', '料理・日本酒', '赤坂・銀座', '食の話をしながら楽しく飲みたいです。'),
  ('a9c320da-064f-45ba-9c5e-1c4d242f113c', 33, '旅行会社', '500〜800万円', '国内旅行・写真', '新宿・恵比寿', '次の旅行先を一緒に考えましょう。'),
  ('ec12755b-ad4f-4168-b84a-755b07c2b9ae', 45, '電機メーカー', '800〜1,000万円', 'ウイスキー・読書', '銀座・赤坂', '静かに会話を楽しめる方を探しています。'),
  ('589c2c59-5428-4189-bb35-35fc2b1917a3', 39, '広告制作', '800〜1,000万円', '新店巡り・デザイン', '恵比寿・六本木', '新しいお店を一緒に楽しみたいです。'),
  ('0d40a3ae-300a-4574-9c03-6c06d7e8d4a5', 35, '物流会社', '500〜800万円', 'お笑い・食べ歩き', '新宿・渋谷', '関西出身です。気軽に話してください。'),
  ('7574235f-e637-42a5-8a0a-9628d5fbd2f9', 42, '医療関係', '1,000万円以上', 'テニス・旅行', '銀座・六本木', '休日の楽しみを共有できると嬉しいです。'),
  ('4015eaac-48a5-4d1c-8940-5dbc387e86a5', 30, 'ゲーム制作', '500〜800万円', 'ゲーム・漫画・映画', '渋谷・新宿', '趣味の話から仲良くなりたいです。'),
  ('d1189c54-2b95-4c00-b8b6-dcd10f13c123', 46, '不動産業', '1,000万円以上', 'ワイン・ゴルフ', '銀座・六本木', '落ち着いたお店で会話を楽しみたいです。'),
  ('57735505-06a0-4cdc-9c76-377dc671bf20', 38, '専門商社', '800〜1,000万円', '出張・グルメ', '赤坂・銀座', '各地のおいしいものの話をしましょう。'),
  ('8552eb81-e42a-42b9-93ef-2ddd9d8892e1', 32, '音楽関係', '500〜800万円', 'ライブ・サウナ', '渋谷・恵比寿', '音楽好きな方、ぜひお話ししましょう。'),
  ('5439f384-c719-4d02-a486-69772bf11c8d', 44, '弁護士', '1,000万円以上', 'ワイン・美術', '銀座・青山', '上質な時間と会話を大切にしています。'),
  ('1e3c3064-00bc-4eee-99ae-a24c156ac156', 37, '通信会社', '800〜1,000万円', '食事・旅行', '六本木・赤坂', '福岡と東京のお店を開拓中です。'),
  ('b0b7ab81-3215-4521-9a8c-9ab505df19a9', 34, 'スポーツ用品会社', '500〜800万円', 'マラソン・野球', '新宿・赤坂', '健康的で明るい方とお話ししたいです。'),
  ('935879bd-ef6f-4e94-9307-e208ae96b51e', 49, '経営コンサルタント', '1,000万円以上', '読書・温泉', '銀座・赤坂', 'ゆっくり落ち着いて飲める方を探しています。'),
  ('9a924d61-376f-4981-9d49-eda995f72037', 29, 'アパレル', '500〜800万円', '写真・ファッション', '青山・恵比寿', 'ファッションや写真の話が好きです。'),
  ('64701832-d952-4b07-b2f9-b6509892da12', 47, '自営業', '1,000万円以上', 'ゴルフ・温泉', '銀座・六本木', '穏やかで楽しい夜にしましょう。'),
  ('1aa678e5-b890-4f4d-bffa-fb4d9078e97d', 36, '出版社', '500〜800万円', '読書・映画', '神楽坂・銀座', '本や映画について話せると嬉しいです。'),
  ('8092dcba-a04d-4cb0-a988-ed4a2b477921', 33, '食品メーカー', '500〜800万円', '料理・食べ歩き', '恵比寿・銀座', 'おいしい店を一緒に探しましょう。'),
  ('bcdf0d1a-c872-4ca7-a460-7e26aabac806', 31, 'システムエンジニア', '500〜800万円', '旅行・カメラ', '渋谷・六本木', '気軽に楽しくお話ししたいです。')
ON CONFLICT (user_id) DO UPDATE SET
  age = EXCLUDED.age,
  occupation = EXCLUDED.occupation,
  annual_income = EXCLUDED.annual_income,
  hobbies = EXCLUDED.hobbies,
  preferred_area = EXCLUDED.preferred_area,
  appeal_message = EXCLUDED.appeal_message,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- ホーム画面確認用の投稿。固定IDで再実行時も重複しない。
-- -----------------------------------------------------------------------------
INSERT INTO public.timelines
  (id, user_id, content, media_url, media_type, expires_at, created_at)
VALUES
  ('a3e1f7ab-6207-4fea-9fe4-935e5c273d81', '052eef72-d746-48e7-9363-b4d57bb680f1', '今日は銀座に出勤しています。ゆっくりお話ししたい気分です🌙', NULL, NULL, now() + interval '24 hours', now() - interval '35 minutes'),
  ('cff8f6b8-6f65-4654-89f0-9dc6f58cb4af', '3b00328f-b00d-4fdb-bd34-412e6293ebbc', '六本木でお待ちしています。映画好きな方、おすすめを教えてください🎬', NULL, NULL, now() + interval '24 hours', now() - interval '70 minutes'),
  ('a7a06b57-fe1c-4b89-aa2a-2628039ad64f', 'de7a13ee-1165-428c-9380-af159626c3db', '今夜はスポーツの話で盛り上がれたら嬉しいです。まだまだ元気です！', NULL, NULL, now() + interval '24 hours', now() - interval '2 hours'),
  ('5f629c15-f49c-4140-a237-e75d52c3f95f', 'dd666b72-43a5-42bd-a1d5-687c038e497a', '出勤前にピアノを弾いてリフレッシュしました。赤坂でお待ちしています🎹', NULL, NULL, now() + interval '24 hours', now() - interval '3 hours'),
  ('32dff8f2-0370-4770-be47-0e9ea24bfb45', '01f85ed7-513d-4cc3-b327-7623ee148461', '野球の話がしたい夜です⚾ お仕事帰りにぜひどうぞ。', NULL, NULL, now() + interval '24 hours', now() - interval '90 minutes'),
  ('cc76cc64-752d-4b50-a340-ae6128b84bc1', 'f8ce2c78-a2d1-40ff-9041-c679b2008612', '最近読んだ本がとてもよかったので、今夜おすすめを紹介させてください。', NULL, NULL, now() + interval '24 hours', now() - interval '4 hours'),
  ('5a736a84-71d8-4bd9-a2ec-58c7d36ec21f', 'c1728007-6e40-4f06-a3ac-fabdda157438', '今日も元気に出勤中です。カラオケ好きな方、一緒に歌いましょう🎤', NULL, NULL, now() + interval '24 hours', now() - interval '45 minutes'),
  ('ba873453-0482-4b5d-aa79-7b409c2ef5cf', '2753a995-f69c-43b1-928e-091f4311964e', 'ヨガで整えてから出勤しました。穏やかな時間をご一緒できたら嬉しいです。', NULL, NULL, now() + interval '24 hours', now() - interval '5 hours'),
  ('9df00576-30df-4726-a700-4d481e50e6ec', '269d4ffa-f91d-4a97-84a0-88de21551f7e', '大阪のおいしいお店の話、聞きたい人いますか？新宿で待ってます😊', NULL, NULL, now() + interval '24 hours', now() - interval '2 hours 20 minutes'),
  ('eaa927c2-19eb-45ca-9f70-309e1c44677c', '12a96e1b-8276-4e10-90c4-303aaf65c8d1', '六本木に出勤しました。今夜も丁寧に、心地よい時間をお届けします。', NULL, NULL, now() + interval '24 hours', now() - interval '80 minutes'),
  ('39121cdd-15b5-4661-9bc8-8be05b91db77', 'c54d320e-7287-462b-a49b-8bf54e179588', '今日のおすすめは福岡の話と焼酎です。赤坂でお会いしましょう。', NULL, NULL, now() + interval '24 hours', now() - interval '3 hours 10 minutes'),
  ('ef96dbba-e2d2-47bd-9748-10829b3a6ff0', '588b9119-12ef-4690-865c-5609f5318428', 'サウナでリフレッシュして出勤しました。スポーツ好きな方、大歓迎です！', NULL, NULL, now() + interval '24 hours', now() - interval '55 minutes')
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  expires_at = EXCLUDED.expires_at,
  created_at = EXCLUDED.created_at;

-- 期待件数の検証（キャスト30名、顧客30名）。不一致ならマイグレーションを失敗させる。
DO $$
DECLARE
  demo_cast_count INTEGER;
  demo_customer_count INTEGER;
BEGIN
  SELECT count(*) INTO demo_cast_count
  FROM public.users
  WHERE id IN (SELECT user_id FROM public.cast_profiles)
    AND id IN (
      '052eef72-d746-48e7-9363-b4d57bb680f1', '3b00328f-b00d-4fdb-bd34-412e6293ebbc',
      'bd7523ae-5484-4e70-852e-b03310a6a66e', 'de7a13ee-1165-428c-9380-af159626c3db',
      'd50839f3-1eb8-4c96-bb6f-09cb94d3eff6', 'dd666b72-43a5-42bd-a1d5-687c038e497a',
      'ddb8474f-8fcb-43db-9384-5b7e8d9d69be', '01f85ed7-513d-4cc3-b327-7623ee148461',
      'f8ce2c78-a2d1-40ff-9041-c679b2008612', '2d8c7144-6e42-46c3-ba15-d2241b9d217c',
      'c1728007-6e40-4f06-a3ac-fabdda157438', 'c608266a-d86a-4e44-9c45-a8065ec09a08',
      '6547b5a1-9191-4c0f-83cd-81920d77220e', '8e7d1b83-6988-4c93-bf87-38d4603d027f',
      '2753a995-f69c-43b1-928e-091f4311964e', '269d4ffa-f91d-4a97-84a0-88de21551f7e',
      '31b69d4c-721a-4d5a-a737-1c8bf9d464fb', 'f4e0b085-4e36-4ab2-8cd8-342b71b70c29',
      'fba2ae41-e291-4441-96a8-4705c62a9648', '12a96e1b-8276-4e10-90c4-303aaf65c8d1',
      'c54d320e-7287-462b-a49b-8bf54e179588', 'c37942ef-d161-4443-8881-39ef22c64b53',
      '3101c235-ee5f-4116-acbf-a6ab722ac40b', '573967d8-beb0-46bc-86ac-9abe599a3686',
      'beefbfd8-b590-4004-aeb9-9ea327fe3927', '029f0096-892c-4e05-ae4d-7483641a5b39',
      '95fc4127-5564-413b-a327-683be6634d5a', '8e687609-9356-4a07-8b9a-04baebd2c819',
      '588b9119-12ef-4690-865c-5609f5318428', '0da1d02e-f434-4071-ac5a-e0cb333a1249'
    );

  SELECT count(*) INTO demo_customer_count
  FROM public.users
  WHERE id IN (SELECT user_id FROM public.customer_profiles)
    AND id IN (
      'fe7c16ab-89d9-4f35-be23-37adc30582f3', '1da3a0bb-562b-438a-a29d-7bc64c9e7d65',
      'dbfb3786-7c6a-46f6-b4ea-c8948e4f4dab', '96b0e43b-32e9-463c-8fbb-dd0e4cca56f5',
      '17e4c2a4-69a8-42f8-a339-9b57be9462f7', 'dc75084d-f3e7-41bf-a814-c0c042a0205e',
      '7a2d6ffb-4ff3-427b-8bf0-d31791ec9755', 'ba105a0e-0ab4-449d-8317-207f1c320eb6',
      '39b66b2a-408b-48ee-a90d-9255087d15d5', '2fa5b6f3-7988-491d-9f33-242f527c1e9e',
      '7d0eec74-80fc-4227-83e7-e5edfbf672b6', 'cd51db9f-6b26-4e7c-bd63-3bcd632193f4',
      'a9c320da-064f-45ba-9c5e-1c4d242f113c', 'ec12755b-ad4f-4168-b84a-755b07c2b9ae',
      '589c2c59-5428-4189-bb35-35fc2b1917a3', '0d40a3ae-300a-4574-9c03-6c06d7e8d4a5',
      '7574235f-e637-42a5-8a0a-9628d5fbd2f9', '4015eaac-48a5-4d1c-8940-5dbc387e86a5',
      'd1189c54-2b95-4c00-b8b6-dcd10f13c123', '57735505-06a0-4cdc-9c76-377dc671bf20',
      '8552eb81-e42a-42b9-93ef-2ddd9d8892e1', '5439f384-c719-4d02-a486-69772bf11c8d',
      '1e3c3064-00bc-4eee-99ae-a24c156ac156', 'b0b7ab81-3215-4521-9a8c-9ab505df19a9',
      '935879bd-ef6f-4e94-9307-e208ae96b51e', '9a924d61-376f-4981-9d49-eda995f72037',
      '64701832-d952-4b07-b2f9-b6509892da12', '1aa678e5-b890-4f4d-bffa-fb4d9078e97d',
      '8092dcba-a04d-4cb0-a988-ed4a2b477921', 'bcdf0d1a-c872-4ca7-a460-7e26aabac806'
    );

  IF demo_cast_count <> 30 OR demo_customer_count <> 30 THEN
    RAISE EXCEPTION 'Demo user count mismatch: cast=%, customer=%', demo_cast_count, demo_customer_count;
  END IF;
END $$;
