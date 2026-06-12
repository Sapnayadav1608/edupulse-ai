import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import DashboardRouter from './pages/dashboard/DashboardRouter';
import StudentManagement from './pages/student/StudentManagement';
import StudentProfile from './pages/student/StudentProfile';
import LMS from './pages/lms/LMS';
import AttendanceManagement from './pages/attendance/AttendanceManagement';
import PlacementRouter from './pages/placement/PlacementRouter';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import ChatbotPage from './pages/chatbot/ChatbotPage';
import AIPrediction from './pages/ai/AIPrediction';
import FacultyManagement from './pages/faculty/FacultyManagement';
import NotificationsPage from './pages/notifications/NotificationsPage';
import UserProfile from './pages/profile/UserProfile';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<div className="flex items-center justify-center h-screen"><p className="text-xl text-gray-500">403 — Unauthorized</p></div>} />

        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardRouter />} />
          <Route path="students"      element={<ProtectedRoute roles={['admin','faculty']}><StudentManagement /></ProtectedRoute>} />
          <Route path="students/:id"  element={<ProtectedRoute roles={['admin','faculty']}><StudentProfile /></ProtectedRoute>} />
          <Route path="faculty"       element={<ProtectedRoute roles={['admin']}><FacultyManagement /></ProtectedRoute>} />
          <Route path="lms"           element={<LMS />} />
          <Route path="attendance"    element={<ProtectedRoute roles={['admin','faculty']}><AttendanceManagement /></ProtectedRoute>} />
          <Route path="analytics"     element={<ProtectedRoute roles={['admin','faculty']}><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="placement"     element={<PlacementRouter />} />
          <Route path="chatbot"       element={<ChatbotPage />} />
          <Route path="ai-prediction" element={<ProtectedRoute roles={['faculty','student']}><AIPrediction /></ProtectedRoute>} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile"       element={<UserProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
