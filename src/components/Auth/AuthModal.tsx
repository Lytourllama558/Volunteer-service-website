import { useState } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
  onSuccess: () => void;
};

export function AuthModal({ isOpen, onClose, initialView = 'login', onSuccess }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register'>(initialView);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-gray-900">{view === 'login' ? '登录' : '注册'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          {view === 'login' ? (
            <LoginForm
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
              onSwitchToRegister={() => setView('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
              onSwitchToLogin={() => setView('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
