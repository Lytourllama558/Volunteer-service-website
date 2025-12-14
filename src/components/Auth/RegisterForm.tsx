import { useState } from 'react';
import { registerUser } from '../../services/api';
import { createClient } from '@supabase/supabase-js@2';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

type RegisterFormProps = {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
};

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('两次输入的密码不一致');
      }

      if (formData.password.length < 6) {
        throw new Error('密码至少需要6个字符');
      }

      // 调用注册 API
      await registerUser(formData.email, formData.password, formData.name, formData.phone);

      // 自动登录
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess();
      }
    } catch (err: any) {
      console.error('注册失败:', err);
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-gray-700 mb-2">
          姓名
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="请输入姓名"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-gray-700 mb-2">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="请输入邮箱"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-gray-700 mb-2">
          手机号
        </label>
        <input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="请输入手机号"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-gray-700 mb-2">
          密码
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="至少6个字符"
          required
          minLength={6}
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
          确认密码
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="请再次输入密码"
          required
          minLength={6}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-lg ${
          loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
      >
        {loading ? '注册中...' : '注册'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-red-500 hover:text-red-600"
          disabled={loading}
        >
          已有账号？立即登录
        </button>
      </div>
    </form>
  );
}