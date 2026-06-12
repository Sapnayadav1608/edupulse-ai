import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { motion } from 'framer-motion';

const DashboardLayout = () => {
  const [darkMode, setDarkMode] = useState(true); // always dark to match theme

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  React.useEffect(() => {
    // Force dark mode to match the theme
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }, []);

  return (
    <div className="flex h-screen overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a8a 100%)' }}>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-purple-700 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute top-1/2 right-1/4 w-64 h-64 bg-indigo-600 rounded-full blur-3xl"
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-10">
        <Header darkMode={darkMode} toggleDark={toggleDark} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
