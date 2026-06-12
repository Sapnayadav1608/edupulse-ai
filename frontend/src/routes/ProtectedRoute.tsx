import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

// Redirects unauthenticated users to /login
// Redirects unauthorized roles to /unauthorized
const ProtectedRoute = ({ children, roles }: Props) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen text-primary-600">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
