import { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar, Clock, Settings, LogOut } from 'lucide-react';
import { MyRegistrations } from './MyRegistrations';
import { ProfileInfo } from './ProfileInfo';
import { getUserProfile } from '../../services/api';

type ProfileView = 'info' | 'registrations' | 'settings';

type ProfilePageProps = {
  onBack: () => void;
  onLogout: () => void;
};

export function ProfilePage({ onBack, onLogout }: ProfilePageProps) {
  const [currentView, setCurrentView] = useState<ProfileView>('info');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
    } catch (error) {
      console.error('加载个人资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <User className="text-red-500" size={32} />
              </div>
              <div>
                <h1 className="text-gray-900 mb-1">{profile?.name || '用户'}</h1>
                <p className="text-gray-600">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                <span>返回</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut size={20} />
                <span>退出登录</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Calendar className="text-blue-500" size={32} />
              <div>
                <div className="text-gray-600">参与活动</div>
                <div className="text-gray-900">{profile?.totalActivities || 0} 次</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Clock className="text-green-500" size={32} />
              <div>
                <div className="text-gray-600">志愿时长</div>
                <div className="text-gray-900">{profile?.totalHours || 0} 小时</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Settings className="text-purple-500" size={32} />
              <div>
                <div className="text-gray-600">会员等级</div>
                <div className="text-gray-900">
                  {profile?.totalHours >= 100 ? '金牌志愿者' :
                   profile?.totalHours >= 50 ? '银牌志愿者' :
                   profile?.totalHours >= 10 ? '铜牌志愿者' : '新手志愿者'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg border border-gray-200 p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setCurrentView('info')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      currentView === 'info'
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User size={20} />
                    <span>个人信息</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('registrations')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      currentView === 'registrations'
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={20} />
                    <span>我的报名</span>
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {currentView === 'info' && <ProfileInfo profile={profile} onUpdate={loadProfile} />}
            {currentView === 'registrations' && <MyRegistrations />}
          </main>
        </div>
      </div>
    </div>
  );
}
