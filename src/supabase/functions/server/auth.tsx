// @ts-nocheck

import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export type UserProfile = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  totalHours: number;
  totalActivities: number;
  createdAt: string;
  updatedAt: string;
};

function mapDbProfileToUserProfile(row: any): UserProfile {
  return {
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar ?? undefined,
    bio: row.bio ?? undefined,
    totalHours: row.total_hours ?? 0,
    totalActivities: row.total_activities ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 用户注册
export async function registerUser(email: string, password: string, name: string, phone: string) {
  try {
    // 使用 Supabase Auth 创建用户
    // 注意：由于未配置邮箱服务器，自动确认邮箱
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone }
    });

    if (error) {
      throw new Error(`注册失败: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('用户创建失败');
    }

    // 创建用户资料
    const userProfile: UserProfile = {
      userId: data.user.id,
      name,
      email,
      phone,
      totalHours: 0,
      totalActivities: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1) 写入 Postgres user_profiles（优先）
    try {
      const { error: dbError } = await supabase.from('user_profiles').upsert({
        user_id: data.user.id,
        name,
        email,
        phone,
        avatar: null,
        bio: null,
        total_hours: 0,
        total_activities: 0,
        created_at: userProfile.createdAt,
        updated_at: userProfile.updatedAt,
      });
      if (dbError) {
        console.warn('写入 user_profiles 表失败，将继续写入 KV 作为兜底:', dbError);
      }
    } catch (e) {
      console.warn('写入 user_profiles 表异常，将继续写入 KV 作为兜底:', e);
    }

    // 2) 仍写入 KV（兼容旧逻辑/统计等）
    await kv.set(`user_profile:${data.user.id}`, userProfile);

    return { success: true, user: data.user, profile: userProfile };
  } catch (error) {
    console.error('注册用户失败:', error);
    throw error;
  }
}

// 获取用户资料
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // 优先从 Postgres 读取
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) {
        return mapDbProfileToUserProfile(data);
      }
    } catch (e) {
      console.warn('从 user_profiles 表读取失败，尝试 KV 兜底:', e);
    }

    // KV 兜底
    const profile = await kv.get(`user_profile:${userId}`);
    return profile ?? null;
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return null;
  }
}

// 更新用户资料
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const existing = await kv.get(`user_profile:${userId}`);
    if (!existing) {
      // 若 KV 不存在，尝试从 Postgres 取（兼容只写 SQL 的情况）
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!data) {
        throw new Error('用户资料不存在');
      }
    }

    const updated: UserProfile = {
      ...existing,
      ...updates,
      userId: existing.userId,
      email: existing.email,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };

    // 1) 更新 Postgres
    try {
      const { error: dbError } = await supabase
        .from('user_profiles')
        .update({
          name: updated.name,
          phone: updated.phone,
          avatar: updated.avatar ?? null,
          bio: updated.bio ?? null,
          total_hours: updated.totalHours,
          total_activities: updated.totalActivities,
          updated_at: updated.updatedAt,
        })
        .eq('user_id', userId);
      if (dbError) {
        console.warn('更新 user_profiles 表失败，将继续更新 KV 作为兜底:', dbError);
      }
    } catch (e) {
      console.warn('更新 user_profiles 表异常，将继续更新 KV 作为兜底:', e);
    }

    // 2) 更新 KV
    await kv.set(`user_profile:${userId}`, updated);
    return updated;
  } catch (error) {
    console.error('更新用户资料失败:', error);
    throw error;
  }
}

// 获取所有用户（管理员用）
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    // 优先从 Postgres 获取
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(mapDbProfileToUserProfile);
      }
    } catch (e) {
      console.warn('从 user_profiles 表获取失败，尝试 KV 兜底:', e);
    }

    const profiles = await kv.getByPrefix('user_profile:');
    return profiles ?? [];
  } catch (error) {
    console.error('获取所有用户失败:', error);
    return [];
  }
}

// 验证访问令牌
export async function verifyAccessToken(token: string) {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('验证令牌失败:', error);
    return null;
  }
}
