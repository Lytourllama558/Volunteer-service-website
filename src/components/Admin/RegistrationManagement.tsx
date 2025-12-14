import { useState, useEffect } from 'react';
import { Eye, Trash2, Search, Filter, Edit2, CheckCircle } from 'lucide-react';
import { fetchRegistrations, fetchOpportunities, cancelRegistration, updateRegistration } from '../../services/api';
import type { Registration } from '../../services/api';
import type { Opportunity } from '../../App';

export function RegistrationManagement() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string>('all');
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    status: 'pending' as 'pending' | 'approved' | 'completed' | 'cancelled',
    volunteeredHours: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [regs, opps] = await Promise.all([
        fetchRegistrations(),
        fetchOpportunities()
      ]);
      setRegistrations(regs);
      setOpportunities(opps);
    } catch (error) {
      console.error('加载报名记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('确定要取消这个报名吗？这将恢复一个名额。')) return;
    
    try {
      await cancelRegistration(id);
      await loadData();
    } catch (error) {
      console.error('取消报名失败:', error);
      alert('取消报名失败，请重试');
    }
  };

  const handleUpdate = async (id: string, updatedData: Partial<Registration>) => {
    try {
      await updateRegistration(id, updatedData);
      await loadData();
    } catch (error) {
      console.error('更新报名记录失败:', error);
      alert('更新报名记录失败，请重试');
    }
  };

  const handleEdit = (reg: Registration) => {
    setEditingReg(reg);
    setFormData({
      status: (reg.status ?? 'pending') as any,
      volunteeredHours: typeof reg.volunteeredHours === 'number' ? reg.volunteeredHours : 0,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReg?.id) return;

    const patch: Partial<Registration> = {
      status: formData.status,
    };
    if (formData.status === 'completed') {
      patch.volunteeredHours = formData.volunteeredHours;
    }

    await handleUpdate(editingReg.id, patch);
    setShowEditModal(false);
    setEditingReg(null);
  };

  const getOpportunityTitle = (opportunityId: string) => {
    const opp = opportunities.find(o => o.id === opportunityId);
    return opp ? opp.title : '未知志愿活动';
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phone.includes(searchTerm);
    
    const matchesOpportunity = 
      selectedOpportunity === 'all' || reg.opportunityId === selectedOpportunity;
    
    return matchesSearch && matchesOpportunity;
  });

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
      <div className="mb-6">
        <h2 className="text-gray-900 mb-4">报名记录管理</h2>
        
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索姓名、邮箱或电话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={selectedOpportunity}
                onChange={(e) => setSelectedOpportunity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">所有志愿活动</option>
                {opportunities.map(opp => (
                  <option key={opp.id} value={opp.id}>{opp.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          显示 {filteredRegistrations.length} 条报名记录
        </p>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">姓名</th>
                <th className="px-6 py-3 text-left text-gray-700">联系方式</th>
                <th className="px-6 py-3 text-left text-gray-700">志愿活动</th>
                <th className="px-6 py-3 text-left text-gray-700">状态</th>
                <th className="px-6 py-3 text-left text-gray-700">报名时间</th>
                <th className="px-6 py-3 text-left text-gray-700">志愿时长</th>
                <th className="px-6 py-3 text-right text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{reg.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600">{reg.email}</div>
                    <div className="text-gray-500">{reg.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{getOpportunityTitle(reg.opportunityId)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full ${
                      reg.status === 'completed' ? 'bg-green-100 text-green-800' :
                      reg.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      reg.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reg.status === 'completed' ? '已完成' :
                       reg.status === 'approved' ? '已通过' :
                       reg.status === 'cancelled' ? '已取消' : '待审核'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(reg.registeredAt!).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {reg.volunteeredHours ? `${reg.volunteeredHours} 小时` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(reg)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="编辑状态"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleCancel(reg.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="取消报名"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm || selectedOpportunity !== 'all' 
                ? '未找到匹配的报名记录' 
                : '暂无报名记录'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingReg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-gray-900 mb-6">更新报名状态</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">志愿者</label>
                <p className="text-gray-900">{editingReg.name}</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>

              {formData.status === 'completed' && (
                <div>
                  <label className="block text-gray-700 mb-2">志愿时长（小时）</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.volunteeredHours}
                    onChange={(e) => setFormData({ ...formData, volunteeredHours: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="输入志愿时长"
                  />
                  <p className="text-gray-500 mt-1">标记为已完成时，请输入实际志愿时长</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReg(null);
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