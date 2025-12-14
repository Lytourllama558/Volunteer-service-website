import { Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { View } from '../App';
import logoImg from '../image/01.png';

type NavigationProps = {
  currentView: View;
  onNavigate: (view: View) => void;
  isLoggedIn?: boolean;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
};

export function Navigation({ currentView, onNavigate, isLoggedIn = false, onShowLogin, onShowRegister }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <img 
              src={logoImg} 
              alt="志愿者之家 Logo" 
              className="w-9 h-8 object-contain" 
            />
            <button 
              onClick={() => onNavigate('home')}
              className="text-gray-900"
            >
              志愿者之家
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onNavigate('home')}
              className={`${
                currentView === 'home' ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              首页
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className={`${
                currentView === 'browse' || currentView === 'detail' 
                  ? 'text-red-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              志愿活动
            </button>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              关于我们
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              联系我们
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <User size={20} />
                  <span>我的</span>
                </button>
                <button
                  onClick={() => onNavigate('admin')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  管理后台
                </button>
              </>
            ) : (
              <>
                <button onClick={onShowLogin} className="text-gray-600 hover:text-gray-900">
                  登录
                </button>
                <button
                  onClick={onShowRegister}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  注册
                </button>
                <button
                  onClick={() => onNavigate('admin')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  管理后台
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left ${
                currentView === 'home' ? 'text-red-500' : 'text-gray-600'
              }`}
            >
              首页
            </button>
            <button
              onClick={() => {
                onNavigate('browse');
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left ${
                currentView === 'browse' || currentView === 'detail'
                  ? 'text-red-500'
                  : 'text-gray-600'
              }`}
            >
              志愿活动
            </button>
            <a href="#" className="block text-gray-600">
              关于我们
            </a>
            <a href="#" className="block text-gray-600">
              联系我们
            </a>
            <div className="pt-4 space-y-2 border-t border-gray-200">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-600"
                  >
                    我的
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-600"
                  >
                    管理后台
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      onShowLogin?.();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-600"
                  >
                    登录
                  </button>
                  <button 
                    onClick={() => {
                      onShowRegister?.();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    注册
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-600"
                  >
                    管理后台
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
