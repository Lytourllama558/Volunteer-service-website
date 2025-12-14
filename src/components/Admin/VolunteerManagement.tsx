import { useState, useEffect } from 'react';
import { Search, Edit2, Eye, Award } from 'lucide-react';
import { getAllUsers, updateUserByAdmin } from '../../services/api';
import type { UserProfile } from '../../services/api';

export function VolunteerManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    totalHours: 0,
    totalActivities: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      totalHours: user.totalHours,
      totalActivities: user.totalActivities
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      await updateUserByAdmin(selectedUser.userId, formData);
      await loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('更新用户信息失败:', error);
      alert('更新失败，请重试');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  const getUserLevel = (hours: number) => {
    if (hours >= 100) return { text: '金牌志愿者', class: 'bg-yellow-100 text-yellow-800' };
    if (hours >= 50) return { text: '银牌志愿者', class: 'bg-gray-100 text-gray-800' };
    if (hours >= 10) return { text: '铜牌志愿者', class: 'bg-orange-100 text-orange-800' };
    return { text: '新手志愿者', class: 'bg-blue-100 text-blue-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-gray-900">志愿者管理</h2>
        <div className="text-gray-600">共 {users.length} 名志愿者</div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索姓名、邮箱或电话..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-gray-600">显示 {filteredUsers.length} 名志愿者</p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">姓名</th>
                <th className="px-6 py-3 text-left text-gray-700">联系方式</th>
                <th className="px-6 py-3 text-left text-gray-700">等级</th>
                <th className="px-6 py-3 text-left text-gray-700">志愿时长</th>
                <th className="px-6 py-3 text-left text-gray-700">参与活动</th>
                <th className="px-6 py-3 text-left text-gray-700">注册时间</th>
                <th className="px-6 py-3 text-right text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const level = getUserLevel(user.totalHours);
                return (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{user.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">{user.email}</div>
                      <div className="text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full ${level.class}`}>
                        {level.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{user.totalHours} 小时</td>
                    <td className="px-6 py-4 text-gray-900">{user.totalActivities} 次</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="编辑"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">未找到志愿者</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-gray-900 mb-6">编辑志愿者信息</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">姓名</label>
                <p className="text-gray-900">{selectedUser.name}</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">邮箱</label>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">志愿时长（小时）</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalHours}
                  onChange={(e) => setFormData({ ...formData, totalHours: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">参与活动次数</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalActivities}
                  onChange={(e) => setFormData({ ...formData, totalActivities: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
