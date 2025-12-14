import { Users, Award, Heart, MapPin } from 'lucide-react';

export function Stats() {
  const stats = [
    { icon: Users, label: '活跃志愿者', value: '12,500+' },
    { icon: Award, label: '志愿活动', value: '850+' },
    { icon: Heart, label: '贡献时长', value: '45,000+' },
    { icon: MapPin, label: '服务地点', value: '120+' }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="mx-auto text-red-500 mb-4" size={40} />
              <div className="text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}