-- 志愿者系统关系型表创建与（可选）从 KV 迁移脚本
-- 说明：本项目后端当前使用的 KV key 前缀为：
-- - opportunity:<id>
-- - registration:<id>
-- - user_profile:<userId>
-- 同时后端已经“优先读 activities 表，KV 作为后备”，所以仅创建表不会破坏现有功能。

-- 启用 uuid 生成（若已启用则无影响）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) 活动表（与项目现有后端读取的 activities 对齐）
CREATE TABLE IF NOT EXISTS public.activities (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text NOT NULL,
  organization       text NOT NULL,
  organizer_unit     text,
  category           text DEFAULT '通用',
  location           text NOT NULL,
  date               text NOT NULL,
  signup_start_time  timestamp with time zone,
  signup_end_time    timestamp with time zone,
  activity_start_time timestamp with time zone,
  activity_end_time   timestamp with time zone,
  leader_name        text,
  leader_phone       text,
  duration           text NOT NULL,
  spots_available    integer NOT NULL,
  total_spots        integer NOT NULL,
  description        text NOT NULL,
  requirements       jsonb NOT NULL DEFAULT '[]'::jsonb,
  image              text NOT NULL,
  tags               jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at         timestamp with time zone DEFAULT now(),
  legacy_kv_id       text UNIQUE
);

-- 兼容旧表已创建但缺少 legacy_kv_id 的情况
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS legacy_kv_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_legacy_kv_id ON public.activities(legacy_kv_id);

-- 2) 报名表
CREATE TABLE IF NOT EXISTS public.registrations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id        uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id            uuid,
  name               text NOT NULL,
  email              text NOT NULL,
  phone              text NOT NULL,
  message            text,
  status             text NOT NULL DEFAULT 'pending',
  registered_at      timestamp with time zone DEFAULT now(),
  completed_at       timestamp with time zone,
  volunteered_hours  integer,
  legacy_kv_id       text UNIQUE
);

-- 3) 用户资料表（扩展信息）
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id            uuid PRIMARY KEY,
  name               text NOT NULL,
  email              text NOT NULL,
  phone              text NOT NULL,
  avatar             text,
  bio                text,
  total_hours        integer NOT NULL DEFAULT 0,
  total_activities   integer NOT NULL DEFAULT 0,
  created_at         timestamp with time zone DEFAULT now(),
  updated_at         timestamp with time zone DEFAULT now()
);

-- 索引建议
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_activity_id ON public.registrations(activity_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);

-- 4) 可选：从 KV 迁移（只在 kv_store_725726ab 存在时执行）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'kv_store_725726ab'
  ) THEN
    -- 4.1 迁移用户资料（user_profile:<uuid>）
    INSERT INTO public.user_profiles (
      user_id, name, email, phone, avatar, bio,
      total_hours, total_activities, created_at, updated_at
    )
    SELECT
      (value->>'userId')::uuid,
      COALESCE(value->>'name', ''),
      COALESCE(value->>'email', ''),
      COALESCE(value->>'phone', ''),
      NULLIF(value->>'avatar', ''),
      NULLIF(value->>'bio', ''),
      COALESCE(NULLIF(value->>'totalHours', '')::int, 0),
      COALESCE(NULLIF(value->>'totalActivities', '')::int, 0),
      COALESCE(NULLIF(value->>'createdAt', '')::timestamptz, now()),
      COALESCE(NULLIF(value->>'updatedAt', '')::timestamptz, now())
    FROM public.kv_store_725726ab
    WHERE key LIKE 'user_profile:%'
      AND (value->>'userId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ON CONFLICT (user_id) DO NOTHING;

    -- 4.2 迁移活动（opportunity:<uuid>）
    INSERT INTO public.activities (
      id, title, organization, organizer_unit, category, location, date,
      signup_start_time, signup_end_time, activity_start_time, activity_end_time,
      leader_name, leader_phone, duration,
      spots_available, total_spots, description,
      requirements, image, tags, created_at, legacy_kv_id
    )
    SELECT
      CASE
        WHEN (value->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN (value->>'id')::uuid
        ELSE gen_random_uuid()
      END,
      COALESCE(value->>'title', ''),
      COALESCE(value->>'organization', ''),
      NULLIF(COALESCE(value->>'organizerUnit', value->>'organizer_unit', ''), ''),
      COALESCE(value->>'category', '通用'),
      COALESCE(value->>'location', ''),
      COALESCE(value->>'date', ''),
      NULLIF(value->>'signupStartTime', '')::timestamptz,
      NULLIF(value->>'signupEndTime', '')::timestamptz,
      NULLIF(value->>'activityStartTime', '')::timestamptz,
      NULLIF(value->>'activityEndTime', '')::timestamptz,
      NULLIF(value->>'leaderName', ''),
      NULLIF(value->>'leaderPhone', ''),
      COALESCE(value->>'duration', ''),
      COALESCE(NULLIF(value->>'spotsAvailable', '')::int, 0),
      COALESCE(NULLIF(value->>'totalSpots', '')::int, 0),
      COALESCE(value->>'description', ''),
      COALESCE(value->'requirements', '[]'::jsonb),
      COALESCE(value->>'image', ''),
      COALESCE(value->'tags', '[]'::jsonb),
      COALESCE(NULLIF(value->>'createdAt', '')::timestamptz, now()),
      COALESCE(value->>'id', key)
    FROM public.kv_store_725726ab
    WHERE key LIKE 'opportunity:%'
    ON CONFLICT (legacy_kv_id) DO NOTHING;

    -- 4.3 迁移报名（registration:<reg_...>）
    -- 说明：报名里 opportunityId 可能是 uuid（推荐）或旧的非 uuid（将尝试用 activities.legacy_kv_id 关联）
    INSERT INTO public.registrations (
      activity_id, user_id, name, email, phone, message,
      status, registered_at, completed_at, volunteered_hours, legacy_kv_id
    )
    SELECT
      a.id,
      CASE
        WHEN (value->>'userId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN (value->>'userId')::uuid
        ELSE NULL
      END,
      COALESCE(value->>'name', ''),
      COALESCE(value->>'email', ''),
      COALESCE(value->>'phone', ''),
      NULLIF(value->>'message', ''),
      COALESCE(NULLIF(value->>'status', ''), 'pending'),
      COALESCE(NULLIF(value->>'registeredAt', '')::timestamptz, now()),
      NULLIF(value->>'completedAt', '')::timestamptz,
      NULLIF(value->>'volunteeredHours', '')::int,
      COALESCE(value->>'id', key)
    FROM public.kv_store_725726ab
    LEFT JOIN public.activities a
      ON a.id::text = (value->>'opportunityId')
      OR a.legacy_kv_id = (value->>'opportunityId')
      OR a.legacy_kv_id = CONCAT('opportunity:', (value->>'opportunityId'))
    WHERE key LIKE 'registration:%'
      AND a.id IS NOT NULL
    ON CONFLICT (legacy_kv_id) DO NOTHING;
  END IF;
END $$;

-- 5) 注意：不要立刻删除 KV 表。等后端完全切到 SQL 后再手动清理。
-- DROP TABLE public.kv_store_725726ab;