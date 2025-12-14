import { OpportunityCard } from './OpportunityCard';
import { Opportunity } from '../App';

type FeaturedOpportunitiesProps = {
  opportunities: Opportunity[];
  onViewOpportunity: (opportunity: Opportunity) => void;
};

export function FeaturedOpportunities({ opportunities, onViewOpportunity }: FeaturedOpportunitiesProps) {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-gray-900 mb-4">精选志愿活动</h2>
          <p className="text-gray-600">从这些精选的志愿服务开始，今天就开始创造改变</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onView={() => onViewOpportunity(opportunity)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}