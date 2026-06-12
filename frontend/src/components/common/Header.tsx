import React, { useEffect, useState } from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface HeaderProps {
  darkMode: boolean;
  toggleDark: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/students':      'Students',
  '/faculty':       'Faculty',
  '/placement':     'Placement',
  '/analytics':     'Analytics',
  '/notifications': 'Notifications',
  '/lms':           'Learning Management',
  '/attendance':    'Attendance',
  '/ai-prediction': 'AI Prediction',
  '/chatbot':       'AI Chatbot',
  '/profile':       'My Profile',
};

const Header = ({ darkMode, toggleDark }: HeaderProps) => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [unread, setUnread] = useState(0);

  const pageTitle = PAGE_TITLES[location.pathname] || 'EduPulse AI';
  const initials  = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        setUnread(data.unreadCount || 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="h-16 px-6 flex items-center justify-between sticky top-0 z-30 flex-shrink-0"
      style={{
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left */}
      <div>
        <h1 className="text-base font-semibold text-white leading-none">{pageTitle}</h1>
        <p className="text-xs text-white/30 mt-0.5 hidden sm:block">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Dark mode toggle */}
        <button onClick={toggleDark}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <Bell size={17} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-0.5 leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Profile */}
        <button onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-white/10 transition-all">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white leading-none">{user?.name?.split(' ')[0]}</p>
            <p className="text-[10px] text-white/30 capitalize mt-0.5">{user?.role}</p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
