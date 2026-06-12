import api from './api';

const attendanceService = {
  mark:                 (data: any)         => api.post('/attendance/mark', data),
  getReport:            (params?: any)      => api.get('/attendance/report', { params }),
  getDefaulters:        (params?: any)      => api.get('/attendance/defaulters', { params }),
  getStudentAttendance: (studentId: string) => api.get(`/attendance/student/${studentId}`),
  addMarks:             (data: any)         => api.post('/attendance/marks', data),
  getStudentMarks:      (studentId: string) => api.get(`/attendance/marks/${studentId}`),
  // Student fetches own data (no studentId needed)
  getMyAttendance:      ()                  => api.get('/attendance/my'),
  getMyMarks:           ()                  => api.get('/attendance/my/marks'),
};

export default attendanceService;
