-- ============================================================
-- Mistella: サンプルキャストのアバター画像URL更新
-- 注意: 003_sample_data.sql 実行後に実行すること
-- ============================================================

UPDATE public.users SET avatar_url = 'mistella-demo://cast/01'
  WHERE id = '11111111-0001-0001-0001-000000000001';

UPDATE public.users SET avatar_url = 'mistella-demo://cast/02'
  WHERE id = '11111111-0002-0002-0002-000000000002';

UPDATE public.users SET avatar_url = 'mistella-demo://cast/03'
  WHERE id = '11111111-0003-0003-0003-000000000003';

UPDATE public.users SET avatar_url = 'mistella-demo://cast/04'
  WHERE id = '11111111-0004-0004-0004-000000000004';

UPDATE public.users SET avatar_url = 'mistella-demo://cast/05'
  WHERE id = '11111111-0005-0005-0005-000000000005';

UPDATE public.users SET avatar_url = 'mistella-demo://cast/06'
  WHERE id = '11111111-0006-0006-0006-000000000006';

UPDATE public.users SET avatar_url = 'mistella-demo://cast/07'
  WHERE id = '11111111-0007-0007-0007-000000000007';

UPDATE public.users SET avatar_url = 'mistella-demo://cast/08'
  WHERE id = '11111111-0008-0008-0008-000000000008';

UPDATE public.users SET avatar_url = 'mistella-demo://cast/09'
  WHERE id = '11111111-0009-0009-0009-000000000009';

UPDATE public.users SET avatar_url = 'mistella-demo://cast/10'
  WHERE id = '11111111-0010-0010-0010-000000000010';
