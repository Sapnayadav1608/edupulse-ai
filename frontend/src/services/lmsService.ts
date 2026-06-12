import api from './api';

const lmsService = {
  // Notes
  getNotes:      (params?: any) => api.get('/lms/notes', { params }),
  createNote:    (data: FormData) => api.post('/lms/notes', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteNote:    (id: string) => api.delete(`/lms/notes/${id}`),

  // Assignments
  getAssignments:    (params?: any) => api.get('/lms/assignments', { params }),
  createAssignment:  (data: any) => api.post('/lms/assignments', data),
  deleteAssignment:  (id: string) => api.delete(`/lms/assignments/${id}`),
  submitAssignment:  (id: string, data: FormData) => api.post(`/lms/assignments/${id}/submit`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Quizzes
  getQuizzes:            (params?: any) => api.get('/lms/quizzes', { params }),
  getQuizById:           (id: string)   => api.get(`/lms/quizzes/${id}`),
  getRecommendedQuizzes: ()             => api.get('/lms/quizzes/recommended'),
  createQuiz:            (data: any)    => api.post('/lms/quizzes', data),
  generateAIQuiz:        (data: any)    => api.post('/lms/quizzes/generate-ai', data),
  attemptQuiz:           (id: string, answers: number[]) => api.post(`/lms/quizzes/${id}/attempt`, { answers }),
  deleteQuiz:            (id: string)   => api.delete(`/lms/quizzes/${id}`),

  // Student interests
  updateInterests:      (interests: string[]) => api.patch('/students/me/interests', { interests }),
  getMyProfile:         () => api.get('/students/me'),
  generateInterestQuiz: (data: any) => api.post('/lms/quizzes/interest-quiz', data),
};

export default lmsService;
