import React, { useState } from 'react';
import { BookOpen, ClipboardList, HelpCircle } from 'lucide-react';
import Notes       from './Notes';
import Assignments from './Assignments';
import Quiz        from './Quiz';

const tabs = [
  { id: 'notes',       label: 'Notes',       icon: BookOpen },
  { id: 'assignments', label: 'Assignments',  icon: ClipboardList },
  { id: 'quiz',        label: 'Quiz',         icon: HelpCircle },
];

const LMS = () => {
  const [active, setActive] = useState('notes');

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div>
        <h2 className="page-title">Learning Management System</h2>
        <p className="page-subtitle">Notes • Assignments • Quizzes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
              ${active === id
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {active === 'notes'       && <Notes />}
      {active === 'assignments' && <Assignments />}
      {active === 'quiz'        && <Quiz />}
    </div>
  );
};

export default LMS;
