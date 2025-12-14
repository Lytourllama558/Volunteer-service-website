// @ts-nocheck

async function deleteByPrefix(prefix: string) {
  const items = await kv.getByPrefix(prefix);
  for (const item of items) {
    const keyId = item.id || item.opportunityId || item.userId || '';
    await kv.del(`${prefix}${keyId}`);
  }
  return items.length;
}
import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as auth from './auth.tsx';

const app = new Hono();
const api = new Hono();

// Supabase Postgres client (Edge Function / Deno)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const CLEANUP_TOKEN = Deno.env.get('CLEANUP_TOKEN');

// Middleware
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'apikey'],
  }),
);
app.use('*', logger(console.log));

// 数据类型
type Opportunity = {
  id: string;
  title: string;
  organization: string;
  organizer_unit?: string;
  category: string;
  location: string;
  date: string;
  signup_start_time?: string;
  signup_end_time?: string;
  activity_start_time?: string;
  activity_end_time?: string;
  leader_name?: string;
  leader_phone?: string;
  duration: string;
  spotsAvailable: number;
  totalSpots: number;
  description: string;
  requirements: string[];
  image: string;
  tags: string[];
  createdAt: string;
};

type Registration = {
  id: string;
  opportunityId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  registeredAt: string;
  completedAt?: string;
  volunteeredHours?: number;
};

type DbRegistrationRow = {
  id: string;
  activity_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  status: string | null;
  registered_at: string | null;
  completed_at: string | null;
  volunteered_hours: number | null;
};

function isUuid(value: any): boolean {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function resolveActivityByOpportunityId(opportunityId: any): Promise<any | null> {
  const idStr = typeof opportunityId === 'string' || typeof opportunityId === 'number' ? String(opportunityId) : '';
  if (!idStr) return null;

  try {
    if (isUuid(idStr)) {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', idStr)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('legacy_kv_id', idStr)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (e) {
    console.warn('解析活动 id 失败，将回退到 KV:', e);
    return null;
  }
}

function normalizeRegistrationRow(row: any): Registration {
  return {
    id: row.id,
    opportunityId: row.activity_id,
    userId: row.user_id ?? '',
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message ?? '',
    status: row.status ?? 'pending',
    registeredAt: row.registered_at ?? new Date().toISOString(),
    completedAt: row.completed_at ?? undefined,
    volunteeredHours: row.volunteered_hours ?? undefined,
  };
}

async function resolveActivityIdForAnyOpportunityId(opportunityId: any): Promise<string | null> {
  const activity = await resolveActivityByOpportunityId(opportunityId);
  if (activity?.id && isUuid(activity.id)) return activity.id;
  return null;
}

function normalizeArrayField(value: any, splitter: string) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(splitter)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeOpportunity(source: any) {
  if (!source) return null;
  const normalized = {
    id: source.id || crypto.randomUUID(),
    title: source.title || '',
    organization: source.organization || '',
    organizerUnit: source.organizerUnit ?? source.organizer_unit ?? source.organization ?? '',
    category: source.category ?? '通用',
    location: source.location ?? '',
    date: source.date ?? '',
    signupStartTime: source.signupStartTime ?? source.signup_start_time ?? null,
    signupEndTime: source.signupEndTime ?? source.signup_end_time ?? null,
    activityStartTime: source.activityStartTime ?? source.activity_start_time ?? null,
    activityEndTime: source.activityEndTime ?? source.activity_end_time ?? null,
    leaderName: source.leaderName ?? source.leader_name ?? null,
    leaderPhone: source.leaderPhone ?? source.leader_phone ?? null,
    duration: source.duration ?? '',
    spotsAvailable: typeof source.spotsAvailable === 'number'
      ? source.spotsAvailable
      : typeof source.spots_available === 'number'
        ? source.spots_available
        : 0,
    totalSpots: typeof source.totalSpots === 'number'
      ? source.totalSpots
      : typeof source.total_spots === 'number'
        ? source.total_spots
        : 0,
    description: source.description ?? '',
    requirements: normalizeArrayField(source.requirements ?? source.requirements_text, '\n'),
    image: source.image ?? '',
    tags: normalizeArrayField(source.tags, ','),
    createdAt: source.createdAt ?? source.created_at ?? new Date().toISOString(),
  };
  return normalized;
}

function buildDbPayload(body: any) {
  return {
    title: body.title,
    organization: body.organization,
    organizer_unit: body.organizerUnit ?? body.organizer_unit ?? body.organization,
    category: body.category ?? '通用',
    location: body.location,
    date: body.date,
    signup_start_time: body.signupStartTime ?? null,
    signup_end_time: body.signupEndTime ?? null,
    activity_start_time: body.activityStartTime ?? null,
    activity_end_time: body.activityEndTime ?? null,
    leader_name: body.leaderName ?? null,
    leader_phone: body.leaderPhone ?? null,
    duration: body.duration,
    spots_available: body.spotsAvailable,
    total_spots: body.totalSpots,
    description: body.description,
    requirements: Array.isArray(body.requirements) ? body.requirements : normalizeArrayField(body.requirements, '\n'),
    image: body.image,
    tags: Array.isArray(body.tags) ? body.tags : normalizeArrayField(body.tags, ','),
  };
}

async function persistOpportunityToKv(opportunity: any) {
  const normalized = normalizeOpportunity(opportunity);
  await kv.set(`opportunity:${normalized.id}`, normalized);
  return normalized;
}

// 初始化示例数据
// ==================== 用户认证路由 ====================

// 用户注册
api.post('/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, phone } = body;

    if (!email || !password || !name || !phone) {
      return c.json({ success: false, error: '缺少必填字段' }, 400);
    }

    const result = await auth.registerUser(email, password, name, phone);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('注册失败:', error);
    return c.json({ success: false, error: error.message || '注册失败' }, 400);
  }
});

// 获取当前用户资料
api.get('/auth/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return c.json({ success: false, error: '未授权' }, 401);
    }

    const user = await auth.verifyAccessToken(token);
    if (!user) {
      return c.json({ success: false, error: '无效的令牌' }, 401);
    }

    const profile = await auth.getUserProfile(user.id);
    return c.json({ success: true, data: profile });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return c.json({ success: false, error: '获取用户资料失败' }, 500);
  }
});

// 更新用户资料
api.put('/auth/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return c.json({ success: false, error: '未授权' }, 401);
    }

    const user = await auth.verifyAccessToken(token);
    if (!user) {
      return c.json({ success: false, error: '无效的令牌' }, 401);
    }

    const body = await c.req.json();
    const updated = await auth.updateUserProfile(user.id, body);
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('更新用户资料失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==================== 志愿活动路由 ====================

// === Activities via Postgres tables ===
api.get('/opportunities', async (c) => {
  try {
    let dbRows: any[] = [];
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      dbRows = data || [];
    } catch (err) {
      console.warn('从 Supabase 获取志愿活动失败，使用 KV 数据作为后备:', err);
    }

    const kvRows = await kv.getByPrefix('opportunity:');

    // 以 SQL(UUID) 为主键；若有 legacy_kv_id，则把 KV 的同 id 合并进来，避免重复
    const mergedMap = new Map<string, any>();
    const legacyToUuid = new Map<string, string>();

    (dbRows || []).forEach((row: any) => {
      const normalized = normalizeOpportunity(row);
      if (normalized?.id) {
        mergedMap.set(normalized.id, normalized);
        if (row?.legacy_kv_id != null) {
          legacyToUuid.set(String(row.legacy_kv_id), normalized.id);
        }
      }
    });

    (kvRows || []).forEach((row: any) => {
      const normalized = normalizeOpportunity(row);
      const legacyKey = normalized?.id != null ? String(normalized.id) : '';
      const mappedUuid = legacyKey ? legacyToUuid.get(legacyKey) : null;
      if (mappedUuid && mergedMap.has(mappedUuid)) {
        const existing = mergedMap.get(mappedUuid) || {};
        // 保持 id 为 UUID（SQL 主键），但把 KV 的字段作为补充
        mergedMap.set(mappedUuid, { ...normalized, ...existing, id: mappedUuid });
      } else if (normalized?.id) {
        // 如果 KV 的 id 本身就是 UUID，且 SQL 已有该活动：不要让 KV 覆盖 SQL（例如名额变动）
        if (mergedMap.has(normalized.id)) {
          const existing = mergedMap.get(normalized.id) || {};
          mergedMap.set(normalized.id, { ...normalized, ...existing, id: normalized.id });
        } else {
          // KV-only 的活动继续保留（兼容未迁移/未写入 SQL 的活动）
          mergedMap.set(normalized.id, normalized);
        }
      }
    });

    const result = Array.from(mergedMap.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('获取志愿活动时出错:', error);
    return c.json({ success: false, error: '获取志愿活动失败' }, 500);
  }
});

api.get('/opportunities/:id', async (c) => {
  try {
    const id = c.req.param('id');
    let normalized = null;

    try {
      // 支持两种 id：UUID 或 legacy_kv_id
      const query = supabase.from('activities').select('*');
      const { data, error } = isUuid(id)
        ? await query.eq('id', id).maybeSingle()
        : await query.eq('legacy_kv_id', String(id)).maybeSingle();
      if (error) throw error;
      if (data) {
        normalized = normalizeOpportunity(data);
      }
    } catch (err) {
      console.warn(`从 Supabase 获取志愿活动 ${id} 失败，尝试使用 KV 数据:`, err);
    }

    if (!normalized) {
      const kvData = await kv.get(`opportunity:${id}`);
      if (kvData) {
        normalized = normalizeOpportunity(kvData);
      }
    }

    if (!normalized) {
      return c.json({ success: false, error: '未找到志愿活动' }, 404);
    }

    return c.json({ success: true, data: normalized });
  } catch (error) {
    console.error('获取志愿活动详情时出错:', error);
    return c.json({ success: false, error: '获取志愿活动详情失败' }, 500);
  }
});

api.post('/opportunities', async (c) => {
  try {
    const body = await c.req.json();
    const insertPayload = buildDbPayload(body);
    const { data, error } = await supabase
      .from('activities')
      .insert(insertPayload)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error('创建志愿活动失败，未返回记录');
    }

    const normalized = normalizeOpportunity(data);

    const persisted = await persistOpportunityToKv(normalized);

    return c.json({ success: true, data: persisted }, 201);
  } catch (error) {
    console.error('创建志愿活动时出错:', error);
    return c.json({ success: false, error: '创建志愿活动失败' }, 500);
  }
});

api.put('/opportunities/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updatePayload = buildDbPayload(body);

    // 兼容：UUID / legacy_kv_id / KV-only
    const activity = await resolveActivityByOpportunityId(id);

    // 1) SQL 优先更新（能解析到 activities 记录就更新 SQL）
    if (activity?.id && isUuid(activity.id)) {
      const { data, error } = await supabase
        .from('activities')
        .update(updatePayload)
        .eq('id', activity.id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return c.json({ success: false, error: '未找到志愿活动' }, 404);
      }

      const normalized = normalizeOpportunity(data);

      // best-effort 同步 KV：用 UUID key + legacy key（若存在）
      try {
        await kv.set(`opportunity:${activity.id}`, { ...normalized, id: activity.id });
      } catch (e) {
        console.warn('同步 KV(UUID) 失败(忽略):', e);
      }
      const legacy = data?.legacy_kv_id != null ? String(data.legacy_kv_id) : null;
      if (legacy) {
        try {
          await kv.set(`opportunity:${legacy}`, { ...normalized, id: legacy });
        } catch (e) {
          console.warn('同步 KV(legacy) 失败(忽略):', e);
        }
      } else if (!isUuid(id)) {
        // 没有 legacy_kv_id 时，尽量也覆盖传入的非 UUID key
        try {
          await kv.set(`opportunity:${String(id)}`, { ...normalized, id: String(id) });
        } catch (e) {
          console.warn('同步 KV(param) 失败(忽略):', e);
        }
      }

      return c.json({ success: true, data: { ...normalized, id: activity.id } });
    }

    // 2) KV-only 兜底更新
    const kvData = await kv.get(`opportunity:${id}`);
    if (!kvData) {
      return c.json({ success: false, error: '未找到志愿活动' }, 404);
    }
    const updatedKv = normalizeOpportunity({ ...kvData, ...body, id });
    await kv.set(`opportunity:${id}`, updatedKv);
    return c.json({ success: true, data: updatedKv });
  } catch (error) {
    console.error('更新志愿活动时出错:', error);
    return c.json({ success: false, error: '更新志愿活动失败' }, 500);
  }
});

api.delete('/opportunities/:id', async (c) => {
  try {
    const id = c.req.param('id');
    // 兼容：UUID / legacy_kv_id / KV-only
    const activity = await resolveActivityByOpportunityId(id);

    // 1) SQL 优先删除（若能解析到 activities 记录）
    if (activity?.id && isUuid(activity.id)) {
      try {
        // 若数据库未配置 ON DELETE CASCADE，这里先删 registrations 避免外键阻塞
        await supabase.from('registrations').delete().eq('activity_id', activity.id);
      } catch (e) {
        console.warn('删除活动前清理 registrations 失败(忽略):', e);
      }

      const { data, error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activity.id)
        .select('id, legacy_kv_id')
        .maybeSingle();
      if (error) throw error;
      if (data?.id) {
        // best-effort 清理 KV
        const keys = new Set<string>();
        keys.add(`opportunity:${data.id}`);
        keys.add(`opportunity:${id}`);
        if (data.legacy_kv_id != null) keys.add(`opportunity:${String(data.legacy_kv_id)}`);
        for (const k of keys) {
          try {
            await kv.del(k);
          } catch (e) {
            console.warn('清理 KV 失败(忽略):', k, e);
          }
        }

        return c.json({ success: true, message: '志愿活动已删除' });
      }
    }

    // 2) KV-only 兜底删除
    const kvData = await kv.get(`opportunity:${id}`);
    if (kvData) {
      await kv.del(`opportunity:${id}`);
      return c.json({ success: true, message: '志愿活动已删除' });
    }

    return c.json({ success: false, error: '未找到志愿活动' }, 404);
  } catch (error) {
    console.error('删除志愿活动时出错:', error);
    return c.json({ success: false, error: '删除志愿活动失败' }, 500);
  }
});

// ==================== 报名路由 ====================

api.post('/registrations', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.opportunityId || !body.name || !body.email || !body.phone) {
      return c.json({ success: false, error: '缺少必填字段' }, 400);
    }
    
    // SQL 优先：把 opportunityId 解析到 activities.id（支持 legacy_kv_id），能解析到就走 SQL 报名
    try {
      const activity = await resolveActivityByOpportunityId(body.opportunityId);
      if (activity) {
        const spotsAvailable = activity.spots_available ?? 0;
        if (spotsAvailable <= 0) {
          return c.json({ success: false, error: '名额已满' }, 400);
        }

        const nowIso = new Date().toISOString();
        const userId = isUuid(body.userId) ? body.userId : null;
        const activityId = activity.id;

        const { data: inserted, error: insertErr } = await supabase
          .from('registrations')
          .insert({
            activity_id: activityId,
            user_id: userId,
            name: body.name,
            email: body.email,
            phone: body.phone,
            message: body.message || null,
            status: 'pending',
            registered_at: nowIso,
          })
          .select('*')
          .maybeSingle();
        if (insertErr) {
          // 防重复报名：数据库唯一约束（23505）时，直接返回友好提示，不要回退 KV
          const pgCode = (insertErr as any)?.code;
          if (pgCode === '23505') {
            return c.json({ success: false, error: '你已报名该活动，请勿重复报名' }, 409);
          }
          throw insertErr;
        }

        // 并发安全一点：用 spots_available 的旧值做条件更新
        const { data: updatedRows, error: decErr } = await supabase
          .from('activities')
          .update({ spots_available: spotsAvailable - 1 })
          .eq('id', activityId)
          .eq('spots_available', spotsAvailable)
          .select('id');
        if (decErr) throw decErr;
        if (!updatedRows || updatedRows.length === 0) {
          // 名额在并发中被抢光：回滚本次报名
          await supabase.from('registrations').delete().eq('id', inserted.id);
          return c.json({ success: false, error: '名额已满' }, 400);
        }

        // 更新用户统计（SQL 优先；失败不阻断报名）
        if (userId) {
          try {
            const { data: profileRow } = await supabase
              .from('user_profiles')
              .select('total_activities')
              .eq('user_id', userId)
              .maybeSingle();
            const totalActivities = (profileRow?.total_activities ?? 0) + 1;
            await supabase
              .from('user_profiles')
              .update({ total_activities: totalActivities, updated_at: nowIso })
              .eq('user_id', userId);
          } catch (e) {
            console.warn('更新 user_profiles.total_activities 失败:', e);
          }
        }

        return c.json(
          {
            success: true,
            data: normalizeRegistrationRow(inserted),
            message: '报名成功！',
          },
          201,
        );
      }
    } catch (e) {
      console.warn('SQL 报名失败，回退到 KV 报名:', e);
    }

    // KV 兜底：兼容非 uuid 活动/旧数据
    const opportunity = await kv.get(`opportunity:${body.opportunityId}`);
    if (!opportunity) {
      return c.json({ success: false, error: '志愿活动不存在' }, 404);
    }

    if (opportunity.spotsAvailable <= 0) {
      return c.json({ success: false, error: '名额已满' }, 400);
    }

    const registration: Registration = {
      id: `reg_${Date.now()}`,
      opportunityId: body.opportunityId,
      userId: body.userId || '',
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message || '',
      status: 'pending',
      registeredAt: new Date().toISOString(),
    };

    await kv.set(`registration:${registration.id}`, registration);

    opportunity.spotsAvailable -= 1;
    await kv.set(`opportunity:${body.opportunityId}`, opportunity);

    // 更新用户统计
    if (body.userId) {
      const profile = await auth.getUserProfile(body.userId);
      if (profile) {
        profile.totalActivities += 1;
        await kv.set(`user_profile:${body.userId}`, profile);
      }
    }

    return c.json(
      {
        success: true,
        data: registration,
        message: '报名成功！',
      },
      201,
    );
  } catch (error) {
    console.error('提交报名时出错:', error);
    return c.json({ success: false, error: '报名失败，请稍后重试' }, 500);
  }
});

// 获取用户的报名记录
api.get('/user/registrations', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return c.json({ success: false, error: '未授权' }, 401);
    }

    const user = await auth.verifyAccessToken(token);
    if (!user) {
      return c.json({ success: false, error: '无效的令牌' }, 401);
    }

    const merged: Registration[] = [];

    // SQL 优先
    try {
      const filters: string[] = [];
      if (isUuid(user.id)) filters.push(`user_id.eq.${user.id}`);
      if (user.email) filters.push(`email.eq.${user.email}`);
      if (filters.length > 0) {
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .or(filters.join(','))
          .order('registered_at', { ascending: false });
        if (!error && data) {
          merged.push(...data.map(normalizeRegistrationRow));
        }
      }
    } catch (e) {
      console.warn('从 registrations 表读取失败，回退到 KV:', e);
    }

    // KV 兜底
    const allRegistrations = await kv.getByPrefix('registration:');
    const userRegistrations = allRegistrations.filter(
      (reg: Registration) => reg.userId === user.id || reg.email === user.email,
    );
    merged.push(...userRegistrations);

    // 去重
    const uniq = new Map<string, Registration>();
    merged.forEach((r) => uniq.set(r.id, r));

    return c.json({ success: true, data: Array.from(uniq.values()) });
  } catch (error) {
    console.error('获取用户报名记录失败:', error);
    return c.json({ success: false, error: '获取报名记录失败' }, 500);
  }
});

api.get('/opportunities/:id/registrations', async (c) => {
  try {
    const opportunityId = c.req.param('id');
    const merged: Registration[] = [];

    // legacy_kv_id 兼容：/opportunities/4/registrations 也能查到 SQL 报名
    let resolvedActivityId: string | null = null;
    if (isUuid(opportunityId)) {
      resolvedActivityId = opportunityId;
    } else {
      try {
        const { data } = await supabase
          .from('activities')
          .select('id')
          .eq('legacy_kv_id', String(opportunityId))
          .maybeSingle();
        if (data?.id && isUuid(data.id)) resolvedActivityId = data.id;
      } catch (e) {
        console.warn('通过 legacy_kv_id 解析活动失败，将仅查询 KV 报名:', e);
      }
    }

    // SQL 优先
    if (resolvedActivityId && isUuid(resolvedActivityId)) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .eq('activity_id', resolvedActivityId)
          .order('registered_at', { ascending: false });
        if (!error && data) {
          merged.push(...data.map(normalizeRegistrationRow));
        }
      } catch (e) {
        console.warn('从 registrations 表读取失败，回退到 KV:', e);
      }
    }

    // KV 兜底
    const allRegistrations = await kv.getByPrefix('registration:');
    const opportunityRegistrations = allRegistrations.filter(
      (reg: Registration) => reg.opportunityId === opportunityId || (resolvedActivityId && reg.opportunityId === resolvedActivityId),
    );
    merged.push(...opportunityRegistrations);

    const uniq = new Map<string, Registration>();
    merged.forEach((r) => uniq.set(r.id, r));
    return c.json({ success: true, data: Array.from(uniq.values()) });
  } catch (error) {
    console.error('获取报名记录时出错:', error);
    return c.json({ success: false, error: '获取报名记录失败' }, 500);
  }
});

api.get('/registrations', async (c) => {
  try {
    const merged: Registration[] = [];

    // SQL 优先
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('registered_at', { ascending: false });
      if (!error && data) {
        merged.push(...data.map(normalizeRegistrationRow));
      }
    } catch (e) {
      console.warn('从 registrations 表读取失败，回退到 KV:', e);
    }

    // KV 兜底
    const registrations = await kv.getByPrefix('registration:');
    merged.push(...registrations);

    const uniq = new Map<string, Registration>();
    merged.forEach((r) => uniq.set(r.id, r));
    return c.json({ success: true, data: Array.from(uniq.values()) });
  } catch (error) {
    console.error('获取所有报名记录时出错:', error);
    return c.json({ success: false, error: '获取报名记录失败' }, 500);
  }
});

// 更新报名状态（管理员）
api.put('/registrations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    // SQL 优先：当 registration id 是 uuid 时，更新 Postgres registrations
    if (isUuid(id)) {
      try {
        const nowIso = new Date().toISOString();
        const patch: any = {
          status: body.status ?? undefined,
          message: body.message ?? undefined,
        };
        if (typeof body.volunteeredHours === 'number') patch.volunteered_hours = body.volunteeredHours;
        if (body.status === 'completed') patch.completed_at = nowIso;

        // 先取旧值，用于更新用户时长/统计
        const { data: beforeRow, error: beforeErr } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (beforeErr) throw beforeErr;
        if (!beforeRow) {
          return c.json({ success: false, error: '未找到报名记录' }, 404);
        }

        const { data: updatedRow, error: updErr } = await supabase
          .from('registrations')
          .update(patch)
          .eq('id', id)
          .select('*')
          .maybeSingle();
        if (updErr) throw updErr;

        // 完成后更新用户志愿时长（best-effort）
        try {
          if (body.status === 'completed' && typeof body.volunteeredHours === 'number') {
            const userId = beforeRow.user_id;
            if (userId && isUuid(userId)) {
              const { data: profileRow } = await supabase
                .from('user_profiles')
                .select('total_hours')
                .eq('user_id', userId)
                .maybeSingle();
              const totalHours = (profileRow?.total_hours ?? 0) + body.volunteeredHours;
              await supabase
                .from('user_profiles')
                .update({ total_hours: totalHours, updated_at: nowIso })
                .eq('user_id', userId);
            }
          }
        } catch (e) {
          console.warn('更新 user_profiles.total_hours 失败(忽略):', e);
        }

        return c.json({ success: true, data: normalizeRegistrationRow(updatedRow ?? beforeRow) });
      } catch (e) {
        console.warn('SQL 更新报名失败，回退到 KV:', e);
      }
    }
    
    const registration = await kv.get(`registration:${id}`);
    if (!registration) {
      return c.json({ success: false, error: '未找到报名记录' }, 404);
    }
    
    const updated = {
      ...registration,
      ...body
    };
    
    // 如果标记为完成，更新用户志愿时长
    if (body.status === 'completed' && body.volunteeredHours && registration.userId) {
      const profile = await auth.getUserProfile(registration.userId);
      if (profile) {
        profile.totalHours += body.volunteeredHours;
        profile.updatedAt = new Date().toISOString();
        await kv.set(`user_profile:${registration.userId}`, profile);
      }
      updated.completedAt = new Date().toISOString();
    }
    
    await kv.set(`registration:${id}`, updated);
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('更新报名状态失败:', error);
    return c.json({ success: false, error: '更新报名状态失败' }, 500);
  }
});

api.delete('/registrations/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // SQL 优先：当 registration id 是 uuid 时，从 Postgres 删除，并回补名额
    if (isUuid(id)) {
      try {
        const nowIso = new Date().toISOString();

        const { data: regRow, error: getErr } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (getErr) throw getErr;
        if (!regRow) {
          return c.json({ success: false, error: '未找到报名记录' }, 404);
        }

        // 删除报名
        const { error: delErr } = await supabase.from('registrations').delete().eq('id', id);
        if (delErr) throw delErr;

        // 回补活动名额（best-effort）
        try {
          const activityId = regRow.activity_id;
          if (activityId && isUuid(activityId)) {
            const { data: actRow } = await supabase
              .from('activities')
              .select('spots_available, total_spots')
              .eq('id', activityId)
              .maybeSingle();
            const spotsAvailable = actRow?.spots_available ?? 0;
            const totalSpots = actRow?.total_spots ?? null;
            const next = totalSpots == null ? spotsAvailable + 1 : Math.min(spotsAvailable + 1, totalSpots);
            await supabase
              .from('activities')
              .update({ spots_available: next })
              .eq('id', activityId);
          }
        } catch (e) {
          console.warn('回补 activities.spots_available 失败(忽略):', e);
        }

        // 更新用户统计（best-effort）
        try {
          const userId = regRow.user_id;
          if (userId && isUuid(userId)) {
            const { data: profileRow } = await supabase
              .from('user_profiles')
              .select('total_activities')
              .eq('user_id', userId)
              .maybeSingle();
            const totalActivities = Math.max(0, (profileRow?.total_activities ?? 0) - 1);
            await supabase
              .from('user_profiles')
              .update({ total_activities: totalActivities, updated_at: nowIso })
              .eq('user_id', userId);
          }
        } catch (e) {
          console.warn('更新 user_profiles.total_activities 失败(忽略):', e);
        }

        return c.json({ success: true, message: '报名已取消' });
      } catch (e) {
        console.warn('SQL 取消报名失败，回退到 KV:', e);
      }
    }
    
    const registration = await kv.get(`registration:${id}`);
    if (!registration) {
      return c.json({ success: false, error: '未找到报名记录' }, 404);
    }
    
    const opportunity = await kv.get(`opportunity:${registration.opportunityId}`);
    if (opportunity) {
      opportunity.spotsAvailable += 1;
      await kv.set(`opportunity:${registration.opportunityId}`, opportunity);
    }
    
    // 更新用户统计
    if (registration.userId) {
      const profile = await auth.getUserProfile(registration.userId);
      if (profile && profile.totalActivities > 0) {
        profile.totalActivities -= 1;
        profile.updatedAt = new Date().toISOString();
        await kv.set(`user_profile:${registration.userId}`, profile);
      }
    }
    
    await kv.del(`registration:${id}`);
    
    return c.json({ success: true, message: '报名已取消' });
  } catch (error) {
    console.error('取消报名时出错:', error);
    return c.json({ success: false, error: '取消报名失败' }, 500);
  }
});

// ==================== 统计路由 ====================

api.get('/stats', async (c) => {
  try {
    // SQL 优先统计（更准确；不依赖 KV）
    try {
      const [{ data: actRows }, { data: regRows }, { data: userRows }] = await Promise.all([
        supabase.from('activities').select('spots_available, total_spots'),
        supabase.from('registrations').select('id'),
        supabase.from('user_profiles').select('total_hours'),
      ]);

      const totalSpots = (actRows || []).reduce((sum: number, row: any) => sum + (row.total_spots ?? 0), 0);
      const availableSpots = (actRows || []).reduce((sum: number, row: any) => sum + (row.spots_available ?? 0), 0);
      const totalHours = (userRows || []).reduce((sum: number, row: any) => sum + (row.total_hours ?? 0), 0);

      const stats = {
        totalOpportunities: (actRows || []).length,
        totalRegistrations: (regRows || []).length,
        totalUsers: (userRows || []).length,
        totalSpots,
        availableSpots,
        occupiedSpots: totalSpots - availableSpots,
        totalVolunteerHours: totalHours,
      };

      return c.json({ success: true, data: stats });
    } catch (e) {
      console.warn('SQL 统计失败，回退到 KV 统计:', e);
    }

    // KV 兜底统计
    const opportunities = await kv.getByPrefix('opportunity:');
    const registrations = await kv.getByPrefix('registration:');
    const users = await kv.getByPrefix('user_profile:');

    const totalSpots = opportunities.reduce((sum: number, opp: Opportunity) => sum + opp.totalSpots, 0);
    const availableSpots = opportunities.reduce((sum: number, opp: Opportunity) => sum + opp.spotsAvailable, 0);
    const totalHours = users.reduce((sum: number, user: any) => sum + (user.totalHours || 0), 0);

    const stats = {
      totalOpportunities: opportunities.length,
      totalRegistrations: registrations.length,
      totalUsers: users.length,
      totalSpots,
      availableSpots,
      occupiedSpots: totalSpots - availableSpots,
      totalVolunteerHours: totalHours,
    };

    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取统计数据时出错:', error);
    return c.json({ success: false, error: '获取统计数据失败' }, 500);
  }
});

// 一次性清理 KV 中的活动/报名数据，防止初始化样例残留
api.post('/admin/cleanup-kv', async (c) => {
  try {
    const authHeader = c.req.header('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    if (!CLEANUP_TOKEN || token !== CLEANUP_TOKEN) {
      return c.json({ success: false, error: '未授权' }, 401);
    }

    const deletedOpp = await deleteByPrefix('opportunity:');
    const deletedReg = await deleteByPrefix('registration:');
    const deletedProfiles = await deleteByPrefix('user_profile:');

    return c.json({ success: true, data: { deletedOpportunities: deletedOpp, deletedRegistrations: deletedReg, deletedProfiles } });
  } catch (error) {
    console.error('清理 KV 失败:', error);
    return c.json({ success: false, error: '清理失败' }, 500);
  }
});

// ==================== 管理员路由 ====================

// 获取所有用户（管理员）
api.get('/admin/users', async (c) => {
  try {
    const users = await auth.getAllUsers();
    return c.json({ success: true, data: users });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return c.json({ success: false, error: '获取用户列表失败' }, 500);
  }
});

// 更新用户信息（管理员）
api.put('/admin/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    const updated = await auth.updateUserProfile(userId, body);
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('更新用户信息失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 健康检查
api.get('/health', (c) => {
  return c.json({ status: 'ok', message: '志愿者服务系统运行正常' });
});

// 兼容两种路径：
// 1) /functions/v1/make-server-725726ab/<path>  -> api 看到的是 /<path>
// 2) 旧版如果曾用过 /make-server-725726ab/<path> 前缀，也继续可用
app.route('/', api);
app.route('/make-server-725726ab', api);

Deno.serve(app.fetch);
