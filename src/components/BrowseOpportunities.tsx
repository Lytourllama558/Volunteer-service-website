import { useState } from 'react';
import { Search } from 'lucide-react';
import { OpportunityCard } from './OpportunityCard';
import { Opportunity } from '../App';

type BrowseOpportunitiesProps = {
  opportunities: Opportunity[];
  onViewOpportunity: (opportunity: Opportunity) => void;
  loading?: boolean;
};

export function BrowseOpportunities({ opportunities, onViewOpportunity, loading = false }: BrowseOpportunitiesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'spots-desc' | 'spots-asc'>('spots-desc');

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    const spotsA = a.spotsAvailable / a.totalSpots;
    const spotsB = b.spotsAvailable / b.totalSpots;
    return sortBy === 'spots-desc' ? spotsB - spotsA : spotsA - spotsB;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-gray-900 mb-4">浏览志愿活动</h1>
          <p className="text-gray-600">发现与您的兴趣和技能相匹配的志愿服务</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索志愿活动..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <span>排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'spots-desc' | 'spots-asc')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="spots-desc">剩余名额多 → 少</option>
                <option value="spots-asc">剩余名额少 → 多</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setSortBy('spots-desc');
              }}
              className="text-gray-600 hover:text-gray-900 underline"
            >
              重置筛选
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            共显示 {filteredOpportunities.length} 个志愿活动
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedOpportunities.map(opportunity => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onView={() => onViewOpportunity(opportunity)}
                />
              ))}
            </div>

            {filteredOpportunities.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-2">未找到相关志愿活动</p>
                <p className="text-gray-500">请尝试调整您的搜索或筛选条件</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}