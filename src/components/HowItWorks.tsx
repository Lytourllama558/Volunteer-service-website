import { Search, UserPlus, Heart } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: '浏览志愿活动',
      description: '按类别与时间筛选，找到适合您的志愿服务。'
    },
    {
      icon: UserPlus,
      title: '注册报名',
      description: '创建并完善个人资料，一键提交报名申请。'
    },
    {
      icon: Heart,
      title: '参与并记录工时',
      description: '参与志愿服务，系统自动记录工时与贡献。'
    }
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-gray-900 mb-4">如何开始</h2>
          <p className="text-gray-600">开始很简单。按照以下简单步骤开始您的志愿者之旅。</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <step.icon className="text-red-500" size={32} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}