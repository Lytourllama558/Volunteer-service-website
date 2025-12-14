
-- 在 Supabase Dashboard -> SQL Editor 直接执行
-- 注意：若某些约束/索引已存在，会自动跳过或需要先手动确认。

BEGIN;

-- =============== 1) activities: 约束（名额一致性） ===============
DO $$
BEGIN
  -- total_spots 非负
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activities_total_spots_nonneg'
  ) THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_total_spots_nonneg
      CHECK (total_spots >= 0);
  END IF;

  -- spots_available 非负
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activities_spots_available_nonneg'
  ) THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_spots_available_nonneg
      CHECK (spots_available >= 0);
  END IF;

  -- spots_available <= total_spots
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activities_spots_available_le_total'
  ) THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_spots_available_le_total
      CHECK (spots_available <= total_spots);
  END IF;
END $$;

-- =============== 2) registrations: 约束（状态/时长） ===============
DO $$
BEGIN
  -- status 取值集合
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registrations_status_check'
  ) THEN
    ALTER TABLE public.registrations
      ADD CONSTRAINT registrations_status_check
      CHECK (status IN ('pending','approved','completed','cancelled'));
  END IF;

  -- volunteered_hours 非负（允许 NULL）
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registrations_volunteered_hours_nonneg'
  ) THEN
    ALTER TABLE public.registrations
      ADD CONSTRAINT registrations_volunteered_hours_nonneg
      CHECK (volunteered_hours IS NULL OR volunteered_hours >= 0);
  END IF;
END $$;

-- =============== 3) 索引（查询性能） ===============
-- activities.created_at 排序
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);

-- activities.legacy_kv_id 兼容查询
CREATE INDEX IF NOT EXISTS idx_activities_legacy_kv_id ON public.activities(legacy_kv_id);

-- registrations 常用查询
CREATE INDEX IF NOT EXISTS idx_registrations_activity_id ON public.registrations(activity_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_registered_at ON public.registrations(registered_at);

-- =============== 4) 唯一性（防重复报名/防重复映射） ===============
-- legacy_kv_id 应当唯一（同一个旧 KV id 只对应一个活动）
CREATE UNIQUE INDEX IF NOT EXISTS uq_activities_legacy_kv_id
  ON public.activities(legacy_kv_id)
  WHERE legacy_kv_id IS NOT NULL;

-- 防重复报名（登录用户）：同一活动同一 user_id 只能报一次
CREATE UNIQUE INDEX IF NOT EXISTS uq_registrations_activity_user
  ON public.registrations(activity_id, user_id)
  WHERE user_id IS NOT NULL;

-- 防重复报名（游客/按邮箱）：同一活动同一 email 只能报一次
-- 若你希望“同邮箱可多人报名”，可以删掉这一条
CREATE UNIQUE INDEX IF NOT EXISTS uq_registrations_activity_email
  ON public.registrations(activity_id, email);

COMMIT;
