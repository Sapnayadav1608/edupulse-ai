import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  BarChart2, Briefcase, MessageSquare, Bell, LogOut,
  ChevronLeft, ChevronRight, GraduationCap, Brain, UserCog,
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard',     icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Students',      icon: Users,           path: '/students' },
  { label: 'Faculty',       icon: UserCog,         path: '/faculty' },
  { label: 'Placement',     icon: Briefcase,       path: '/placement' },
  { label: 'Analytics',     icon: BarChart2,       path: '/analytics' },
  { label: 'Notifications', icon: Bell,            path: '/notifications' },
];

const facultyNav = [
  { label: 'Dashboard',     icon: LayoutDashboard, path: '/dashboard' },
  { label: 'LMS',           icon: BookOpen,        path: '/lms' },
  { label: 'Attendance',    icon: ClipboardList,   path: '/attendance' },
  { label: 'AI Predict',    icon: Brain,           path: '/ai-prediction' },
  { label: 'Notifications', icon: Bell,            path: '/notifications' },
];

const studentNav = [
  { label: 'Dashboard',     icon: LayoutDashboard, path: '/dashboard' },
  { label: 'LMS',           icon: BookOpen,        path: '/lms' },
  { label: 'Placement',     icon: Briefcase,       path: '/placement' },
  { label: 'AI Predict',    icon: Brain,           path: '/ai-prediction' },
  { label: 'Notifications', icon: Bell,            path: '/notifications' },
  { label: 'AI Chatbot',    icon: MessageSquare,   path: '/chatbot' },
];

const ROLE_BADGE: Record<string, string> = {
  admin:   'bg-red-500/20 text-red-300 border border-red-500/30',
  faculty: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  student: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'faculty' ? facultyNav : studentNav;
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <aside
      className={`${collapsed ? 'w-[68px]' : 'w-64'} flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out relative z-20`}
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        minHeight: '100vh',
      }}
    >
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 h-16`}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">EduPulse</p>
              <p className="text-white/30 text-xs leading-none mt-0.5">AI Platform</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* User */}
      {!collapsed ? (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-none">{user?.name}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 capitalize ${ROLE_BADGE[user?.role || 'student']}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-3 flex justify-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-white/20 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Menu</p>
        )}
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink key={path} to={path} title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.1)] border border-white/20'
                 : 'text-white/40 hover:bg-white/8 hover:text-white/80'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-white' : 'text-white/40'} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={handleLogout} title={collapsed ? 'Logout' : undefined}
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-all`}>
          <LogOut size={17} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
