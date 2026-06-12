import api from './api';

const placementService = {
  getStats:             ()              => api.get('/placement/stats'),
  getCompanies:         (params?: any)  => api.get('/placement/companies', { params }),
  createCompany:        (data: any)     => api.post('/placement/companies', data),
  updateCompany:        (id: string, data: any) => api.put(`/placement/companies/${id}`, data),
  deleteCompany:        (id: string)    => api.delete(`/placement/companies/${id}`),
  apply:                (companyId: string, data?: any) => api.post(`/placement/apply/${companyId}`, data || {}),
  applyWithResume:      (companyId: string, formData: FormData) => api.post(`/placement/apply/${companyId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getApplications:      (params?: any)  => api.get('/placement/applications', { params }),
  getMyApplications:    ()              => api.get('/placement/my-applications'),
  updateStatus:         (id: string, data: any) => api.put(`/placement/applications/${id}/status`, data),
};

export default placementService;
