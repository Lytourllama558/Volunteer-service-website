import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, XCircle, CheckCircle } from 'lucide-react';
import { getUserRegistrations, cancelRegistration, fetchOpportunities } from '../../services/api';
import type { Opportunity } from '../../App';

export function MyRegistrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [regs, opps] = await Promise.all([
        getUserRegistrations(),
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

  const getOpportunity = (opportunityId: string) => {
    return opportunities.find(opp => opp.id === opportunityId);
  };

  const handleCancel = async (registrationId: string) => {
    if (!confirm('确定要取消这个报名吗？')) return;

    try {
      await cancelRegistration(registrationId);
      await loadData();
    } catch (error) {
      console.error('取消报名失败:', error);
      alert('取消失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: '待审核', class: 'bg-yellow-100 text-yellow-800' },
      approved: { text: '已通过', class: 'bg-blue-100 text-blue-800' },
      completed: { text: '已完成', class: 'bg-green-100 text-green-800' },
      cancelled: { text: '已取消', class: 'bg-gray-100 text-gray-800' }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return <span className={`px-3 py-1 rounded-full ${badge.class}`}>{badge.text}</span>;
  };

  const filteredRegistrations = registrations.filter(reg => 
    filter === 'all' || reg.status === filter
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-gray-900 mb-4">我的报名</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: '全部' },
            { value: 'pending', label: '待审核' },
            { value: 'approved', label: '已通过' },
            { value: 'completed', label: '已完成' },
            { value: 'cancelled', label: '已取消' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value as any)}
              className={`px-4 py-2 rounded-lg ${
                filter === value
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无报名记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((reg) => {
              const opportunity = getOpportunity(reg.opportunityId);
              if (!opportunity) return null;

              return (
                <div key={reg.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-gray-900 mb-1">{opportunity.title}</h3>
                      <p className="text-gray-600">{opportunity.organization}</p>
                    </div>
                    {getStatusBadge(reg.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      <span>{opportunity.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span>{opportunity.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} />
                      <span>{opportunity.duration}</span>
                    </div>
                  </div>

                  {reg.volunteeredHours && (
                    <div className="flex items-center gap-2 text-green-600 mb-3">
                      <CheckCircle size={16} />
                      <span>志愿时长: {reg.volunteeredHours} 小时</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <div className="text-gray-500">
                      报名时间: {new Date(reg.registeredAt).toLocaleDateString('zh-CN')}
                    </div>
                    {reg.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(reg.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <XCircle size={18} />
                        <span>取消报名</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
