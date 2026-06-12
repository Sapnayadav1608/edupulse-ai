import api from './api';

export const analyticsService = {
  getOverview:            () => api.get('/analytics/overview'),
  getDepartmentStats:     () => api.get('/analytics/department'),
  getCGPADistribution:    () => api.get('/analytics/cgpa-distribution'),
  getAttendanceTrend:     () => api.get('/analytics/attendance-trend'),
  getSubjectPerformance:  () => api.get('/analytics/subject-performance'),
  getPlacementAnalytics:  () => api.get('/analytics/placement'),
};

export const chatbotService = {
  sendMessage: (message: string, history: any[]) =>
    api.post('/chatbot/message', { message, history }),
};
