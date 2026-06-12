import React, { useState } from 'react';
import { ClipboardList, BarChart2, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MarkAttendance    from './MarkAttendance';
import AttendanceReports from './AttendanceReports';
import MarksEntry        from './MarksEntry';

const AttendanceManagement = () => {
  const { user }  = useAuth();
  const [active, setActive] = useState('mark');

  const tabs = [
    { id: 'mark',    label: 'Mark Attendance', icon: ClipboardList },
    { id: 'reports', label: 'Reports',         icon: BarChart2 },
    ...(user?.role === 'admin' || user?.role === 'faculty'
      ? [{ id: 'marks', label: 'Marks Entry', icon: BookOpen }]
      : []),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="page-title">Attendance & Academic Tracking</h2>
        <p className="page-subtitle">Mark attendance • View reports • Enter marks</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
              ${active === id
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {active === 'mark'    && <MarkAttendance />}
      {active === 'reports' && <AttendanceReports />}
      {active === 'marks'   && <MarksEntry />}
    </div>
  );
};

export default AttendanceManagement;
