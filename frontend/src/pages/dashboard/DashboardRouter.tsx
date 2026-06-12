import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import FacultyDashboard from './FacultyDashboard';
import StudentDashboard from './StudentDashboard';

// Automatically renders the correct dashboard based on logged-in user's role
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'admin')   return <AdminDashboard />;
  if (user?.role === 'faculty') return <FacultyDashboard />;
  return <StudentDashboard />;
};

export default DashboardRouter;
