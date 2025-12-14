import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { Opportunity } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { submitRegistration } from '../services/api';

type OpportunityDetailProps = {
  opportunity: Opportunity;
  onBack: () => void;
  onRegistrationSuccess?: () => void;
};

export function OpportunityDetail({ opportunity, onBack, onRegistrationSuccess }: OpportunityDetailProps) {
  const [spotsAvailable, setSpotsAvailable] = useState(opportunity.spotsAvailable);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateTime = (value?: string) => {
    if (!value) return null;
    return value.replace('T', ' ');
  };

  const formatTimeRange = (start?: string, end?: string) => {
    const startFormatted = formatDateTime(start);
    const endFormatted = formatDateTime(end);
    if (startFormatted && endFormatted) return `${startFormatted} 至 ${endFormatted}`;
    return startFormatted || endFormatted || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      await submitRegistration({
        opportunityId: opportunity.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      });

      // 立即更新本地名额显示（避免等待列表刷新/合并逻辑造成的延迟）
      setSpotsAvailable((prev) => Math.max(0, prev - 1));
      
      setSubmitted(true);
      
      // 通知父组件刷新数据
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
      
      setTimeout(() => {
        setShowSignUpForm(false);
        setSubmitted(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 3000);
    } catch (err) {
      console.error('提交报名失败:', err);
      setError(err instanceof Error ? err.message : '报名失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // 切换到另一个活动详情时，重置名额
    setSpotsAvailable(opportunity.spotsAvailable);
  }, [opportunity.id, opportunity.spotsAvailable]);

  const spotsPercentage = (spotsAvailable / opportunity.totalSpots) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          返回志愿活动列表
        </button>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Image Header */}
          <div className="relative h-80">
            <ImageWithFallback
              src={opportunity.image}
              alt={opportunity.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <span className="bg-white px-4 py-2 rounded-full text-gray-900">
                {opportunity.category || '志愿活动'}
              </span>
              {opportunity.signupEndTime && (
                <span className="bg-red-500/90 text-white px-4 py-2 rounded-full">
                  报名截止：{opportunity.signupEndTime}
                </span>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Title and Organization */}
            <div className="mb-6">
              <h1 className="text-gray-900 mb-2">{opportunity.title}</h1>
              <p className="text-gray-600">{opportunity.organization}</p>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="text-red-500" size={24} />
                <div>
                  <div className="text-gray-600">地点</div>
                  <div className="text-gray-900">{opportunity.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="text-red-500" size={24} />
                <div>
                  <div className="text-gray-600">日期</div>
                  <div className="text-gray-900">{opportunity.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="text-red-500" size={24} />
                <div>
                  <div className="text-gray-600">时长</div>
                  <div className="text-gray-900">{opportunity.duration}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Users className="text-red-500" size={24} />
                <div>
                  <div className="text-gray-600">剩余名额</div>
                  <div className="text-gray-900">{spotsAvailable} / {opportunity.totalSpots}</div>
                </div>
              </div>
            </div>

            {/* Overview */}
            <div className="mb-8">
              <h2 className="text-gray-900 mb-4">信息总览</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                {opportunity.organizerUnit && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">发起单位</div>
                    <div className="text-gray-900">{opportunity.organizerUnit}</div>
                  </div>
                )}
                {opportunity.signupStartTime && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">报名开始时间</div>
                    <div className="text-gray-900">{formatDateTime(opportunity.signupStartTime)}</div>
                  </div>
                )}
                {opportunity.signupEndTime && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">报名结束时间</div>
                    <div className="text-gray-900">{formatDateTime(opportunity.signupEndTime)}</div>
                  </div>
                )}
                {opportunity.activityStartTime && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">活动开始时间</div>
                    <div className="text-gray-900">{formatDateTime(opportunity.activityStartTime)}</div>
                  </div>
                )}
                {opportunity.activityEndTime && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">活动结束时间</div>
                    <div className="text-gray-900">{formatDateTime(opportunity.activityEndTime)}</div>
                  </div>
                )}
                {opportunity.leaderName && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">项目负责人</div>
                    <div className="text-gray-900">{opportunity.leaderName}</div>
                  </div>
                )}
                {opportunity.leaderPhone && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">负责人电话</div>
                    <div className="text-gray-900">{opportunity.leaderPhone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-900">报名进度</span>
                <span className="text-gray-600">剩余 {Math.round(spotsPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full"
                  style={{ width: `${spotsPercentage}%` }}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {opportunity.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            {/* Description & Extra Info */}
            <div className="mb-8">
              <h2 className="text-gray-900 mb-4">关于此志愿活动</h2>
              <p className="text-gray-600">{opportunity.description}</p>
            </div>

            {/* Requirements */}
            <div className="mb-8">
              <h3 className="text-gray-900 mb-4">要求</h3>
              <ul className="space-y-2">
                {opportunity.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sign Up Button */}
            {!showSignUpForm && (
              <button
                onClick={() => setShowSignUpForm(true)}
                disabled={spotsAvailable === 0}
                className={`w-full py-3 rounded-lg ${
                  spotsAvailable === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {spotsAvailable === 0 ? '名额已满' : '报名参加此活动'}
              </button>
            )}

            {/* Sign Up Form */}
            {showSignUpForm && !submitted && (
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-gray-900 mb-4">报名参加此活动</h3>
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(opportunity.signupStartTime || opportunity.signupEndTime) && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-gray-500">报名时间</div>
                      <div className="text-gray-900">
                        {formatTimeRange(opportunity.signupStartTime, opportunity.signupEndTime) || '待定'}
                      </div>
                    </div>
                  )}
                  {(opportunity.activityStartTime || opportunity.activityEndTime) && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-gray-500">活动时间</div>
                      <div className="text-gray-900">
                        {formatTimeRange(opportunity.activityStartTime, opportunity.activityEndTime) || '待定'}
                      </div>
                    </div>
                  )}
                  {(opportunity.leaderName || opportunity.leaderPhone) && (
                    <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                      <div className="text-gray-500">负责人信息</div>
                      <div className="text-gray-900">
                        {opportunity.leaderName ? `${opportunity.leaderName}` : ''}
                        {opportunity.leaderName && opportunity.leaderPhone ? ' · ' : ''}
                        {opportunity.leaderPhone ? `联系电话：${opportunity.leaderPhone}` : ''}
                      </div>
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 mb-2">
                      姓名 *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-700 mb-2">
                      电子邮箱 *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-gray-700 mb-2">
                      联系电话 *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-gray-700 mb-2">
                      您为什么想参加志愿活动？（可选）
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`flex-1 py-3 rounded-lg ${
                        submitting 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {submitting ? '提交中...' : '提交申请'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignUpForm(false);
                        setError(null);
                      }}
                      disabled={submitting}
                      className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Success Message */}
            {submitted && (
              <div className="border-t border-gray-200 pt-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
                  <h3 className="text-gray-900 mb-2">申请已提交！</h3>
                  <p className="text-gray-600">
                    感谢您的报名。您很快就会收到一封包含更多详细信息的确认邮件。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}