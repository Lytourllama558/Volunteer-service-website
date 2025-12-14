import { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { updateUserProfile } from '../../services/api';

type ProfileInfoProps = {
  profile: any;
  onUpdate: () => void;
};

export function ProfileInfo({ profile, onUpdate }: ProfileInfoProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    bio: profile?.bio || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await updateUserProfile(formData);
      await onUpdate();
      setEditing(false);
    } catch (err: any) {
      console.error('更新资料失败:', err);
      setError(err.message || '更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      bio: profile?.bio || ''
    });
    setEditing(false);
    setError('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-gray-900">个人信息</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Edit2 size={18} />
            <span>编辑</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">姓名</label>
          {editing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              disabled={loading}
            />
          ) : (
            <p className="text-gray-900">{profile?.name}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-2">邮箱</label>
          <p className="text-gray-600">{profile?.email}</p>
          {editing && <p className="text-gray-500 mt-1">邮箱无法修改</p>}
        </div>

        <div>
          <label className="block text-gray-700 mb-2">手机号</label>
          {editing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              disabled={loading}
            />
          ) : (
            <p className="text-gray-900">{profile?.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-2">个人简介</label>
          {editing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="介绍一下自己..."
              disabled={loading}
            />
          ) : (
            <p className="text-gray-900">{profile?.bio || '暂无简介'}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-2">注册时间</label>
          <p className="text-gray-600">
            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('zh-CN') : '-'}
          </p>
        </div>

        {editing && (
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <Save size={18} />
              <span>{loading ? '保存中...' : '保存'}</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
            >
              <X size={18} />
              <span>取消</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
