import { useState, useEffect } from 'react';
import { Users, Award, Heart, TrendingUp } from 'lucide-react';
import { fetchStats, fetchOpportunities, fetchRegistrations } from '../../services/api';
import type { Opportunity } from '../../App';
import type { Registration } from '../../services/api';

export function AdminStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    totalRegistrations: 0,
    totalSpots: 0,
    availableSpots: 0,
    occupiedSpots: 0
  });
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, opportunities, registrations] = await Promise.all([
        fetchStats(),
        fetchOpportunities(),
        fetchRegistrations()
      ]);
      
      setStats(statsData);
      setRecentOpportunities(opportunities.slice(0, 5));
      setRecentRegistrations(registrations.slice(-5).reverse());
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-6">数据概览</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="text-blue-500" size={32} />
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div className="text-gray-600 mb-1">志愿活动总数</div>
            <div className="text-gray-900">{stats.totalOpportunities}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-green-500" size={32} />
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div className="text-gray-600 mb-1">报名总数</div>
            <div className="text-gray-900">{stats.totalRegistrations}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Heart className="text-red-500" size={32} />
            </div>
            <div className="text-gray-600 mb-1">可用名额</div>
            <div className="text-gray-900">{stats.availableSpots} / {stats.totalSpots}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="text-purple-500" size={32} />
            </div>
            <div className="text-gray-600 mb-1">已占用名额</div>
            <div className="text-gray-900">{stats.occupiedSpots}</div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Opportunities */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">最新志愿活动</h3>
          <div className="space-y-4">
            {recentOpportunities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无数据</p>
            ) : (
              recentOpportunities.map((opp) => (
                <div key={opp.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <div className="text-gray-900 mb-1">{opp.title}</div>
                    <div className="text-gray-600">{opp.organization}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600">{opp.spotsAvailable}/{opp.totalSpots}</div>
                    <div className="text-gray-500">名额</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">最新报名</h3>
          <div className="space-y-4">
            {recentRegistrations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无数据</p>
            ) : (
              recentRegistrations.map((reg) => (
                <div key={reg.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <div className="text-gray-900 mb-1">{reg.name}</div>
                    <div className="text-gray-600">{reg.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500">
                      {new Date(reg.registeredAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
