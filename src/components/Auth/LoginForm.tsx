import { useState } from 'react';
import { createClient } from '@supabase/supabase-js@2';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

type LoginFormProps = {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
};

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.session) {
        // 保存 token
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess();
      }
    } catch (err: any) {
      console.error('登录失败:', err);
      setError('登录失败，请检查邮箱和密码');
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
        <label htmlFor="email" className="block text-gray-700 mb-2">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="请输入邮箱"
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="请输入密码"
          required
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
        {loading ? '登录中...' : '登录'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-red-500 hover:text-red-600"
          disabled={loading}
        >
          还没有账号？立即注册
        </button>
      </div>
    </form>
  );
}