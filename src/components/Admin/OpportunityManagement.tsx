import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { fetchOpportunities, createOpportunity, updateOpportunity, deleteOpportunity } from '../../services/api';
import type { Opportunity } from '../../App';

export function OpportunityManagement() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    organizerUnit: '',
    category: '通用',
    location: '',
    date: '',
    signupStartTime: '',
    signupEndTime: '',
    activityStartTime: '',
    activityEndTime: '',
    leaderName: '',
    leaderPhone: '',
    duration: '',
    spotsAvailable: 10,
    totalSpots: 10,
    description: '',
    requirements: '',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80',
    tags: ''
  });

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const data = await fetchOpportunities();
      setOpportunities(data);
    } catch (error) {
      console.error('加载志愿活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const opportunityData = {
        title: formData.title,
        organization: formData.organization,
        organizerUnit: formData.organizerUnit || formData.organization,
        category: formData.category,
        location: formData.location,
        date: formData.date,
        signupStartTime: formData.signupStartTime,
        signupEndTime: formData.signupEndTime,
        activityStartTime: formData.activityStartTime,
        activityEndTime: formData.activityEndTime,
        leaderName: formData.leaderName,
        leaderPhone: formData.leaderPhone,
        duration: formData.duration,
        spotsAvailable: Number(formData.spotsAvailable),
        totalSpots: Number(formData.totalSpots),
        description: formData.description,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        image: formData.image,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      if (editingId) {
        await updateOpportunity(editingId, opportunityData);
      } else {
        await createOpportunity(opportunityData);
      }
      
      await loadOpportunities();
      resetForm();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleEdit = (opp: Opportunity) => {
    setEditingId(opp.id);
    setFormData({
      title: opp.title,
      organization: opp.organization,
      organizerUnit: opp.organizerUnit || opp.organization,
      category: opp.category,
      location: opp.location,
      date: opp.date,
      signupStartTime: opp.signupStartTime || '',
      signupEndTime: opp.signupEndTime || '',
      activityStartTime: opp.activityStartTime || '',
      activityEndTime: opp.activityEndTime || '',
      leaderName: opp.leaderName || '',
      leaderPhone: opp.leaderPhone || '',
      duration: opp.duration,
      spotsAvailable: opp.spotsAvailable,
      totalSpots: opp.totalSpots,
      description: opp.description,
      requirements: opp.requirements.join('\n'),
      image: opp.image,
      tags: opp.tags.join(', ')
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个志愿活动吗？')) return;
    
    try {
      await deleteOpportunity(id);
      await loadOpportunities();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      organization: '',
      organizerUnit: '',
      category: '环境保护',
      location: '',
      date: '',
      signupStartTime: '',
      signupEndTime: '',
      activityStartTime: '',
      activityEndTime: '',
      leaderName: '',
      leaderPhone: '',
      duration: '',
      spotsAvailable: 10,
      totalSpots: 10,
      description: '',
      requirements: '',
      image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80',
      tags: ''
    });
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
        <h2 className="text-gray-900">志愿活动管理</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          <Plus size={20} />
          添加新活动
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-900">{editingId ? '编辑志愿活动' : '添加新志愿活动'}</h3>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">标题 *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">组织名称 *</label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* 分类取消，保留为通用分类以兼容后端 */}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">地点 *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">日期 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例如：2025年12月5日"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">报名开始时间 *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.signupStartTime}
                      onChange={(e) => setFormData({ ...formData, signupStartTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">报名结束时间 *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.signupEndTime}
                      onChange={(e) => setFormData({ ...formData, signupEndTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">活动开始时间 *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.activityStartTime}
                      onChange={(e) => setFormData({ ...formData, activityStartTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">活动结束时间 *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.activityEndTime}
                      onChange={(e) => setFormData({ ...formData, activityEndTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">项目负责人姓名 *</label>
                    <input
                      type="text"
                      required
                      value={formData.leaderName}
                      onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">负责人电话 *</label>
                    <input
                      type="tel"
                      required
                      placeholder="例如：13800000000"
                      value={formData.leaderPhone}
                      onChange={(e) => setFormData({ ...formData, leaderPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">发起单位 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例如：志愿者之家社区服务中心"
                    value={formData.organizerUnit}
                    onChange={(e) => setFormData({ ...formData, organizerUnit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">时长 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例如：3小时"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">可用名额 *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.spotsAvailable}
                      onChange={(e) => setFormData({ ...formData, spotsAvailable: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">总名额 *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.totalSpots}
                      onChange={(e) => setFormData({ ...formData, totalSpots: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">描述 *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">要求（每行一条）</label>
                  <textarea
                    rows={3}
                    placeholder="例如：&#10;无需经验&#10;请自备园艺手套"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">标签（用逗号分隔）</label>
                  <input
                    type="text"
                    placeholder="例如：户外活动, 适合家庭, 周末"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">图片 URL</label>
                  <input
                    type="text"
                    placeholder="支持 https:// 外链或 /images/... 相对路径"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600"
                  >
                    {editingId ? '保存修改' : '创建'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Opportunities List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">标题</th>
                <th className="px-6 py-3 text-left text-gray-700">组织</th>
                <th className="px-6 py-3 text-left text-gray-700">分类</th>
                <th className="px-6 py-3 text-left text-gray-700">日期</th>
                <th className="px-6 py-3 text-left text-gray-700">名额</th>
                <th className="px-6 py-3 text-right text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{opp.title}</td>
                  <td className="px-6 py-4 text-gray-600">{opp.organization}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {opp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{opp.date}</td>
                  <td className="px-6 py-4 text-gray-600">{opp.spotsAvailable}/{opp.totalSpots}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(opp)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(opp.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
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

        {opportunities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无志愿活动</p>
          </div>
        )}
      </div>
    </div>
  );
}
