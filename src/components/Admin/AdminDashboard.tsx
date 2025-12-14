import { useState, useEffect } from 'react';
import { LayoutDashboard, List, Users, Plus, LogOut, Award } from 'lucide-react';
import { OpportunityManagement } from './OpportunityManagement';
import { RegistrationManagement } from './RegistrationManagement';
import { AdminStats } from './AdminStats';
import { VolunteerManagement } from './VolunteerManagement';

type AdminView = 'dashboard' | 'opportunities' | 'registrations' | 'volunteers';

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-gray-900">志愿者管理系统</h1>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut size={20} />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg border border-gray-200 p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      currentView === 'dashboard'
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutDashboard size={20} />
                    <span>仪表板</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('opportunities')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      currentView === 'opportunities'
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <List size={20} />
                    <span>志愿活动</span>
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
                    <Users size={20} />
                    <span>报名记录</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('volunteers')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      currentView === 'volunteers'
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Award size={20} />
                    <span>志愿者管理</span>
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {currentView === 'dashboard' && <AdminStats />}
            {currentView === 'opportunities' && <OpportunityManagement />}
            {currentView === 'registrations' && <RegistrationManagement />}
            {currentView === 'volunteers' && <VolunteerManagement />}
          </main>
        </div>
      </div>
    </div>
  );
}