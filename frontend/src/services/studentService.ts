import api from './api';

export interface StudentData {
  _id?: string;
  user?: { _id: string; name: string; email: string };
  rollNumber: string;
  department: string;
  semester: number;
  batch: string;
  phone?: string;
  cgpa?: number;
  placementStatus?: string;
  createdAt?: string;
}

export interface CreateStudentPayload {
  name: string;
  email: string;
  password?: string;
  rollNumber: string;
  department: string;
  semester: number;
  batch: string;
  phone?: string;
  cgpa?: number;
}

const studentService = {
  getAll: (params?: { search?: string; department?: string; semester?: string }) =>
    api.get('/students', { params }),

  getById: (id: string) =>
    api.get(`/students/${id}`),

  // Student fetches their own profile
  getMe: () =>
    api.get('/students/me'),

  create: (data: CreateStudentPayload) =>
    api.post('/students', data),

  update: (id: string, data: Partial<CreateStudentPayload>) =>
    api.put(`/students/${id}`, data),

  delete: (id: string) =>
    api.delete(`/students/${id}`),
};

export default studentService;
