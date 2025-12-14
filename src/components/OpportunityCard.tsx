import { MapPin, Calendar, Clock, Users, Phone } from 'lucide-react';
import { Opportunity } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

type OpportunityCardProps = {
  opportunity: Opportunity;
  onView: () => void;
};

export function OpportunityCard({ opportunity, onView }: OpportunityCardProps) {
  const spotsPercentage = Math.min(100, Math.max(0, (opportunity.spotsAvailable / opportunity.totalSpots) * 100));
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <ImageWithFallback
          src={opportunity.image}
          alt={opportunity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className="bg-white px-3 py-1 rounded-full text-gray-900">
            {opportunity.category}
          </span>
        </div>
        {opportunity.signupEndTime && (
          <div className="absolute bottom-4 right-4">
            <span className="bg-red-500/90 text-white px-3 py-1 rounded-full">
              报名截止：{opportunity.signupEndTime}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-gray-900 mb-2">{opportunity.title}</h3>
        <p className="text-gray-600 mb-1">{opportunity.organization}</p>
        {opportunity.organizerUnit && (
          <p className="text-gray-500 mb-4">发起单位：{opportunity.organizerUnit}</p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={16} />
            <span className="text-gray-600">{opportunity.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} />
            <span className="text-gray-600">{opportunity.date}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={16} />
            <span className="text-gray-600">{opportunity.duration}</span>
          </div>
          {opportunity.activityStartTime && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span className="text-gray-600">开始：{opportunity.activityStartTime}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-gray-600">
              <Users size={16} />
              <span className="text-gray-600">剩余 {opportunity.spotsAvailable} 个名额</span>
            </div>
            <span className="text-gray-600">共 {opportunity.totalSpots} 个</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${spotsPercentage}%` }}
            />
          </div>
        </div>

        {(opportunity.leaderName || opportunity.leaderPhone) && (
          <div className="mb-4 flex items-center gap-2 text-gray-600">
            <Phone size={16} />
            <span className="text-gray-600">
              {opportunity.leaderName ? `负责人：${opportunity.leaderName}` : ''}
              {opportunity.leaderName && opportunity.leaderPhone ? ' · ' : ''}
              {opportunity.leaderPhone ? `电话：${opportunity.leaderPhone}` : ''}
            </span>
          </div>
        )}

        <button 
          onClick={onView}
          className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
        >
          查看详情
        </button>
      </div>
    </div>
  );
}