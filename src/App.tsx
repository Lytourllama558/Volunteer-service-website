import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { FeaturedOpportunities } from './components/FeaturedOpportunities';
import { HowItWorks } from './components/HowItWorks';
import { Stats } from './components/Stats';
import { OpportunityDetail } from './components/OpportunityDetail';
import { BrowseOpportunities } from './components/BrowseOpportunities';
import { useOpportunities } from './hooks/useOpportunities';
import { AdminLogin } from './components/Admin/AdminLogin';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AuthModal } from './components/Auth/AuthModal';
import { ProfilePage } from './components/Profile/ProfilePage';

export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  organizerUnit?: string;
  category: string;
  location: string;
  date: string;
  signupStartTime?: string; // 报名开始时间，格式：YYYY-MM-DD HH:mm
  signupEndTime?: string;   // 报名结束时间，格式：YYYY-MM-DD HH:mm
  activityStartTime?: string; // 活动开始时间，格式：YYYY-MM-DD HH:mm
  activityEndTime?: string;   // 活动结束时间，格式：YYYY-MM-DD HH:mm
  leaderName?: string;      // 项目负责人姓名
  leaderPhone?: string;     // 负责人电话
  duration: string;
  spotsAvailable: number;
  totalSpots: number;
  description: string;
  requirements: string[];
  image: string;
  tags: string[];
  createdAt?: string;
};

export type View = 'home' | 'browse' | 'detail' | 'admin' | 'profile';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [viewBeforeProfile, setViewBeforeProfile] = useState<View>('home');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const { opportunities, loading, error, refreshOpportunities } = useOpportunities();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');

  // 检查用户登录状态
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsUserLoggedIn(true);
    }
  }, []);

  const handleViewOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setCurrentView('detail');
  };

  const handleNavigate = (view: View) => {
    // 如果点击个人中心但未登录，显示登录框
    if (view === 'profile' && !isUserLoggedIn) {
      setAuthModalView('login');
      setShowAuthModal(true);
      return;
    }
    
    if (view === 'profile') {
      // 个人中心是独立页面渲染；若从详情页进入，原来的 selectedOpportunity 会被清空
      // 返回时用 browse 更合理，避免回到 detail 产生空白
      const backTarget: View =
        currentView === 'detail' ? 'browse' :
        currentView === 'profile' ? 'home' :
        currentView;
      setViewBeforeProfile(backTarget);
    }

    setCurrentView(view);
    if (view !== 'detail') {
      setSelectedOpportunity(null);
    }
  };

  const handleRegistrationSuccess = () => {
    // 刷新机会列表以更新可用名额
    refreshOpportunities();
  };

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('home');
  };

  const handleUserLogin = () => {
    setIsUserLoggedIn(true);
  };

  const handleUserLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsUserLoggedIn(false);
    setCurrentView('home');
  };

  const handleShowLogin = () => {
    setAuthModalView('login');
    setShowAuthModal(true);
  };

  const handleShowRegister = () => {
    setAuthModalView('register');
    setShowAuthModal(true);
  };

  // 管理员登录页面
  if (currentView === 'admin' && !isAdminLoggedIn) {
    return <AdminLogin onLogin={handleAdminLogin} />; }

  // 管理员后台
  if (currentView === 'admin' && isAdminLoggedIn) {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  // 个人中心
  if (currentView === 'profile' && isUserLoggedIn) {
    return <ProfilePage onBack={() => handleNavigate(viewBeforeProfile)} onLogout={handleUserLogout} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-gray-900 mb-4">加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refreshOpportunities}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-red-50/30 to-white text-gray-900">
      <Navigation 
        currentView={currentView} 
        onNavigate={handleNavigate}
        isLoggedIn={isUserLoggedIn}
        onShowLogin={handleShowLogin}
        onShowRegister={handleShowRegister}
      />
      
      {loading && currentView === 'home' ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      ) : (
        <>
          {currentView === 'home' && (
            <>
              <Hero onBrowse={() => setCurrentView('browse')} />
              <Stats />
              <FeaturedOpportunities 
                opportunities={opportunities.slice(0, 3)} 
                onViewOpportunity={handleViewOpportunity}
              />
              <HowItWorks />
            </>
          )}

          {currentView === 'browse' && (
            <BrowseOpportunities 
              opportunities={opportunities}
              onViewOpportunity={handleViewOpportunity}
              loading={loading}
            />
          )}

          {currentView === 'detail' && selectedOpportunity && (
            <OpportunityDetail 
              opportunity={selectedOpportunity}
              onBack={() => setCurrentView('browse')}
              onRegistrationSuccess={handleRegistrationSuccess}
            />
          )}
        </>
      )}

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="mb-4">志愿者之家</h3>
              <p className="text-gray-400">连接志愿者与有意义的机会，共同创造改变。</p>
            </div>
            <div>
              <h4 className="mb-4">快速链接</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => handleNavigate('home')} className="hover:text-white">首页</button></li>
                <li><button onClick={() => handleNavigate('browse')} className="hover:text-white">浏览机会</button></li>
                <li><a href="#" className="hover:text-white">关于我们</a></li>
                <li><a href="#" className="hover:text-white">联系我们</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">分类</h4>
              <ul className="space-y-2 text-gray-400">
                <li>环境保护</li>
                <li>教育</li>
                <li>社区服务</li>
                <li>动物关怀</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">联系我们</h4>
              <p className="text-gray-400">加入我们的社区，及时了解新的志愿者机会。</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 志愿者之家。版权所有。</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView={authModalView}
        onSuccess={handleUserLogin}
      />
    </div>
  );
}