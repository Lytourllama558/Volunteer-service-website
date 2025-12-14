# Supabase Postgres 多表设计与迁移指南

本文提供将当前基于键值表（kv_store_725726ab）的数据结构，迁移到更“传统”的多表结构（Postgres）的完整方案：建表 SQL、字段说明、索引建议、以及后端路由的读写要点。按此文档执行后，能支持更丰富的查询、统计与数据一致性。

## 一、目标表与关系

- 活动表：`activities`
- 报名表：`registrations`
- 用户资料表：`user_profiles`

关系说明：
- 一条 `registrations` 记录属于一条 `activities`（外键 `activity_id` → `activities.id`）。
- 一条 `user_profiles` 记录对应一个 Supabase `auth.users` 的用户（`user_id`），用于扩展用户资料与统计。

## 二、建表 SQL（直接在 Supabase SQL 编辑器执行）

```sql
-- 1) 活动表
CREATE TABLE IF NOT EXISTS public.activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  organization     text NOT NULL,
  organizer_unit   text,
  category         text DEFAULT '通用',
  location         text NOT NULL,
  date             text NOT NULL, -- 保留原字符串日期；如需结构化可改为 date/timestamp
  signup_start_time timestamp with time zone,
  signup_end_time   timestamp with time zone,
  activity_start_time timestamp with time zone,
  activity_end_time   timestamp with time zone,
  leader_name      text,
  leader_phone     text,
  duration         text NOT NULL,
  spots_available  integer NOT NULL,
  total_spots      integer NOT NULL,
  description      text NOT NULL,
  requirements     jsonb NOT NULL DEFAULT '[]'::jsonb,
  image            text NOT NULL,
  tags             jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at       timestamp with time zone DEFAULT now()
);

-- 2) 报名表
CREATE TABLE IF NOT EXISTS public.registrations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id      uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id          uuid, -- Supabase auth.users.id（可为空，允许游客报名）
  name             text NOT NULL,
  email            text NOT NULL,
  phone            text NOT NULL,
  message          text,
  status           text NOT NULL DEFAULT 'pending',
  registered_at    timestamp with time zone DEFAULT now(),
  completed_at     timestamp with time zone,
  volunteered_hours integer
);

-- 3) 用户资料表（扩展信息，非 Supabase 内置表）
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id          uuid PRIMARY KEY, -- 对应 Supabase auth.users.id
  name             text NOT NULL,
  email            text NOT NULL,
  phone            text NOT NULL,
  avatar           text,
  bio              text,
  total_hours      integer NOT NULL DEFAULT 0,
  total_activities integer NOT NULL DEFAULT 0,
  created_at       timestamp with time zone DEFAULT now(),
  updated_at       timestamp with time zone DEFAULT now()
);

-- 索引建议
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_activity_id ON public.registrations(activity_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
```

> 提示：若你的项目尚未启用 `pgcrypto`（用于 `gen_random_uuid()`），可先执行：
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## 三、字段映射（与前端类型对齐）

前端 `Opportunity` 已包含：
- `title`, `organization`, `organizerUnit`, `category='通用'`, `location`, `date`,
- `signupStartTime`, `signupEndTime`, `activityStartTime`, `activityEndTime`,
- `leaderName`, `leaderPhone`, `duration`, `spotsAvailable`, `totalSpots`, `description`,
- `requirements: string[]`, `image`, `tags: string[]`, `createdAt`

映射：
- 活动 → `activities`（数组字段以 `jsonb` 存储）。
- 报名 → `registrations`（对应前端 `Registration`）。
- 用户资料 → `user_profiles`（来源于 `auth.tsx` 与前端 Profile 视图）。

## 四、后端路由调整要点（从 KV 改为表）

下面为逻辑要点，便于你在 Edge Functions/Node 后端中实现（伪代码/步骤）：

### 活动
- `GET /opportunities`
  - 查询：`SELECT * FROM public.activities ORDER BY created_at DESC;`
- `GET /opportunities/:id`
  - 查询：`SELECT * FROM public.activities WHERE id = $1;`
- `POST /opportunities`
  - 插入：将前端传入的字段写入 `public.activities`；返回新记录。
- `PUT /opportunities/:id`
  - 更新：按字段更新对应活动；保留 `created_at`。
- `DELETE /opportunities/:id`
  - 删除：`DELETE FROM public.activities WHERE id = $1;`

### 报名
- `POST /registrations`
  - 校验名额：先查 `activities.spots_available`；不足则报错。
  - 插入报名：写入 `public.registrations`；成功后将 `activities.spots_available - 1`。
- `GET /registrations`
  - 查询所有报名：`SELECT * FROM public.registrations ORDER BY registered_at DESC;`
- `GET /user/registrations`
  - 按 `user_id` 或 `email` 过滤。
- `PUT /registrations/:id`
  - 更新状态；若 `status=completed` 且存在 `volunteered_hours`，同步累加到 `user_profiles.total_hours`，并写入 `completed_at`。
- `DELETE /registrations/:id`
  - 删除报名；将对应活动 `spots_available + 1`；若用户档案存在且 `total_activities>0` 则减一。

### 统计
- `GET /stats`
  - `totalOpportunities`：`SELECT COUNT(*) FROM activities`
  - `totalRegistrations`：`SELECT COUNT(*) FROM registrations`
  - `totalUsers`：`SELECT COUNT(*) FROM user_profiles`
  - `totalSpots`：`SUM(total_spots)`；`availableSpots`：`SUM(spots_available)`
  - `totalVolunteerHours`：`SUM(user_profiles.total_hours)`

## 五、迁移与数据导入（从 KV 到表，可选）

如果你已有 KV 数据（`kv_store_725726ab`）想迁移：
1. 读取所有 `opportunity:*`、`registration:*`、`user_profile:*` 键。
2. 逐条映射字段，插入到对应表（需注意类型转换：`requirements`/`tags` → jsonb；时间字符串 → `timestamptz` 或保留字符串）。
3. 完成后，将前端 `API_BASE_URL` 指向新的路由实现。

## 六、前端兼容性

- 你已在 `src/services/api.ts` 中把新增字段打包到 `createOpportunity`/`updateOpportunity` 请求体。
- 只要后端路由接收并写入 Postgres，上述字段即可持久化，无需改动前端表单与详情页展示。

## 七、注意事项

- Supabase Auth 的用户信息存放在平台内置表（如 `auth.users`），`user_profiles` 只是补充资料，不替代内置表。
- 时间字段建议统一使用 `timestamp with time zone`（`timestamptz`），前端传 `YYYY-MM-DD HH:mm` 可在后端解析为 UTC 存储。
- 如需复杂过滤（例如时间范围、关键字搜索），请对 `activities` 增加合适索引，并在查询中使用 `ILIKE`、范围过滤等。

## 八、作业加分：约束/索引/防重复报名（推荐）

为增强数据一致性与查询性能，并满足数据库课程作业常见要求（完整性约束、索引设计、唯一性约束），项目提供了额外的 SQL 脚本：

- 执行脚本：`src/supabase/DB_CONSTRAINTS_AND_INDEXES.sql`

脚本包含：
- `activities` 名额一致性约束：`spots_available >= 0`、`total_spots >= 0`、`spots_available <= total_spots`
- `registrations` 约束：`status` 取值集合、`volunteered_hours >= 0`（允许 `NULL`）
- 索引：`activities(legacy_kv_id)`、`registrations(activity_id/user_id/registered_at)` 等
- 唯一性：
  - `activities.legacy_kv_id` 唯一（防止旧 KV id 映射重复）
  - 防重复报名（登录用户）：同一活动 + 同一 `user_id` 仅一条报名
  - 防重复报名（邮箱）：同一活动 + 同一 `email` 仅一条报名（如不需要可在脚本中移除）

---

如需我为你把 Edge Functions（Deno）改造成直接读写上述表的版本，或者搭建一个 Node.js + Prisma 的后端并与前端对接，我可以继续生成样板代码与部署步骤。
