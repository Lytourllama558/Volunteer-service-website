import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Opportunity } from '../App';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-725726ab`;

function getHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token || publicAnonKey}`,
    'Content-Type': 'application/json'
  };
}

export type Registration = {
  id?: string;
  opportunityId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status?: 'pending' | 'approved' | 'completed' | 'cancelled';
  registeredAt?: string;
  completedAt?: string;
  volunteeredHours?: number;
};

function normalizeOpportunity(raw: any): Opportunity {
  if (!raw) {
    throw new Error('无效的志愿活动数据');
  }

  return {
    id: raw.id,
    title: raw.title,
    organization: raw.organization,
    organizerUnit: raw.organizerUnit ?? raw.organizer_unit ?? raw.organization,
    category: raw.category,
    location: raw.location,
    date: raw.date,
    signupStartTime: raw.signupStartTime ?? raw.signup_start_time ?? undefined,
    signupEndTime: raw.signupEndTime ?? raw.signup_end_time ?? undefined,
    activityStartTime: raw.activityStartTime ?? raw.activity_start_time ?? undefined,
    activityEndTime: raw.activityEndTime ?? raw.activity_end_time ?? undefined,
    leaderName: raw.leaderName ?? raw.leader_name ?? undefined,
    leaderPhone: raw.leaderPhone ?? raw.leader_phone ?? undefined,
    duration: raw.duration,
    spotsAvailable: raw.spotsAvailable ?? raw.spots_available ?? 0,
    totalSpots: raw.totalSpots ?? raw.total_spots ?? 0,
    description: raw.description,
    requirements: Array.isArray(raw.requirements)
      ? raw.requirements
      : typeof raw.requirements === 'string'
        ? raw.requirements.split('\n').filter(Boolean)
        : [],
    image: raw.image,
    tags: Array.isArray(raw.tags)
      ? raw.tags
      : typeof raw.tags === 'string'
        ? raw.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [],
    createdAt: raw.createdAt ?? raw.created_at,
  };
}

export type Stats = {
  totalOpportunities: number;
  totalRegistrations: number;
  totalUsers?: number;
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
  totalVolunteerHours?: number;
};

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

// ==================== 用户认证 API ====================

export async function registerUser(email: string, password: string, name: string, phone: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, phone })
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '注册失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, { headers: getHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取用户资料失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('获取用户资料失败:', error);
    throw error;
  }
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '更新用户资料失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('更新用户资料失败:', error);
    throw error;
  }
}

// ==================== 志愿活动 API ====================

export async function fetchOpportunities(): Promise<Opportunity[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/opportunities`, { headers: getHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取志愿活动失败');
    }
    
    return (data.data || []).map((item: any) => normalizeOpportunity(item));
  } catch (error) {
    console.error('获取志愿活动时出错:', error);
    throw error;
  }
}

export async function fetchOpportunityById(id: string): Promise<Opportunity> {
  try {
    const response = await fetch(`${API_BASE_URL}/opportunities/${id}`, { headers: getHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取志愿活动详情失败');
    }
    
    return normalizeOpportunity(data.data);
  } catch (error) {
    console.error('获取志愿活动详情时出错:', error);
    throw error;
  }
}

export async function createOpportunity(opportunity: Omit<Opportunity, 'id' | 'createdAt'>): Promise<Opportunity> {
  try {
    const response = await fetch(`${API_BASE_URL}/opportunities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...opportunity,
        organizerUnit: opportunity.organizerUnit || opportunity.organization,
        signupStartTime: opportunity.signupStartTime || null,
        signupEndTime: opportunity.signupEndTime || null,
        activityStartTime: opportunity.activityStartTime || null,
        activityEndTime: opportunity.activityEndTime || null,
        leaderName: opportunity.leaderName || null,
        leaderPhone: opportunity.leaderPhone || null,
      })
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '创建志愿活动失败');
    }
    
    return normalizeOpportunity(data.data);
  } catch (error) {
    console.error('创建志愿活动时出错:', error);
    throw error;
  }
}

export async function updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
  try {
    const response = await fetch(`${API_BASE_URL}/opportunities/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        ...updates,
        organizerUnit: updates.organizerUnit ?? undefined,
        signupStartTime: updates.signupStartTime ?? undefined,
        signupEndTime: updates.signupEndTime ?? undefined,
        activityStartTime: updates.activityStartTime ?? undefined,
        activityEndTime: updates.activityEndTime ?? undefined,
        leaderName: updates.leaderName ?? undefined,
        leaderPhone: updates.leaderPhone ?? undefined,
      })
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '更新志愿活动失败');
    }
    
    return normalizeOpportunity(data.data);
  } catch (error) {
    console.error('更新志愿活动时出错:', error);
    throw error;
  }
}

export async function deleteOpportunity(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/opportunities/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '删除志愿活动失败');
    }
  } catch (error) {
    console.error('删除志愿活动时出错:', error);
    throw error;
  }
}

// ==================== 报名 API ====================

export async function submitRegistration(registration: Registration): Promise<Registration> {
  try {
    // 获取当前用户ID
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).id : '';
    
    const response = await fetch(`${API_BASE_URL}/registrations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...registration, userId })
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '报名失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('提交报名时出错:', error);
    throw error;
  }
}

export async function getUserRegistrations(): Promise<Registration[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/registrations`, { headers: getHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取报名记录失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('获取用户报名记录失败:', error);
    throw error;
  }
}

export async function fetchRegistrations(): Promise<Registration[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/registrations`, { headers: getHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取报名记录失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('获取报名记录时出错:', error);
    throw error;
  }
}

export async function fetchOpportunityRegistrations(opportunityId: string): Promise<Registration[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/opportunities/${opportunityId}/registrations`, { headers: getHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取报名记录失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('获取报名记录时出错:', error);
    throw error;
  }
}

export async function updateRegistration(id: string, updates: Partial<Registration>): Promise<Registration> {
  try {
    const response = await fetch(`${API_BASE_URL}/registrations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '更新报名状态失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('更新报名状态失败:', error);
    throw error;
  }
}

export async function cancelRegistration(registrationId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/registrations/${registrationId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '取消报名失败');
    }
  } catch (error) {
    console.error('取消报名时出错:', error);
    throw error;
  }
}

// ==================== 统计 API ====================

export async function fetchStats(): Promise<Stats> {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`, { headers: getHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取统计数据失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('获取统计数据时出错:', error);
    throw error;
  }
}

// ==================== 管理员 API ====================

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, { headers: getHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取用户列表失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
}

export async function updateUserByAdmin(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '更新用户信息失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
}

// ==================== 健康检查 API ====================

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { headers: getHeaders() });
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('健康检查失败:', error);
    return false;
  }
}