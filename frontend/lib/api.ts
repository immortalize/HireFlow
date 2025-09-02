import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hireflow_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('hireflow_token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
}

export const jobsAPI = {
  getAll: (params?: any) => api.get('/jobs', { params }),
  getPublic: (params?: any) => {
    if (params?.id) {
      return api.get(`/jobs/public/${params.id}`)
    }
    return api.get('/jobs/public', { params })
  },
  getApplicationsNeedingAssessments: () => api.get('/jobs/applications-needing-assessments'),
  getById: (id: string) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  getStats: (id: string) => api.get(`/jobs/${id}/stats`),
  apply: (jobId: string, data: any) => {
    // If data is FormData, remove the default Content-Type header
    const config = data instanceof FormData ? {
      headers: {
        'Content-Type': undefined
      }
    } : {};
    return api.post(`/jobs/${jobId}/apply`, data, config);
  },
}

export const assessmentsAPI = {
  getAll: (params?: any) => api.get('/assessments', { params }),
  getMyAssessments: () => api.get('/assessments/my'),
  getAssessment: (id: string) => api.get(`/assessments/${id}`),
  create: (data: any) => api.post('/assessments/create', data),
  getForCandidate: (id: string) => api.get(`/assessments/take/${id}`),
  submit: (id: string, data: any) => api.post(`/assessments/submit/${id}`, data),
  submitResults: (id: string, data: any) => api.post(`/assessments/${id}/submit`, data),
  getResults: (id: string) => api.get(`/assessments/results/${id}`),
}

export const crmAPI = {
  getLeads: (params?: any) => api.get('/crm/leads', { params }),
  createLead: (data: any) => api.post('/crm/leads', data),
  updateLead: (id: string, data: any) => api.put(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),
  getPartners: (params?: any) => api.get('/crm/partners', { params }),
  createPartner: (data: any) => api.post('/crm/partners', data),
  updatePartner: (id: string, data: any) => api.put(`/crm/partners/${id}`, data),
  deletePartner: (id: string) => api.delete(`/crm/partners/${id}`),
  getStats: () => api.get('/crm/stats'),
}

export const onboardingAPI = {
  getModules: (params?: any) => api.get('/onboarding/modules', { params }),
  createModule: (data: any) => api.post('/onboarding/modules', data),
  updateModule: (id: string, data: any) => api.put(`/onboarding/modules/${id}`, data),
  deleteModule: (id: string) => api.delete(`/onboarding/modules/${id}`),
  getProgress: (params?: any) => api.get('/onboarding/progress', { params }),
  updateProgress: (moduleId: string, data: any) => api.put(`/onboarding/progress/${moduleId}`, data),
  getDashboard: (params?: any) => api.get('/onboarding/dashboard', { params }),
}

export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  invite: (data: any) => api.post('/users/invite', data),
  getInvitations: () => api.get('/users/invitations'),
  acceptInvitation: (token: string, data: any) => api.post(`/users/invitations/${token}/accept`, data),
  cancelInvitation: (id: string) => api.delete(`/users/invitations/${id}`),
  getCompanySettings: () => api.get('/users/company/settings'),
  updateCompanySettings: (data: any) => api.put('/users/company/settings', data),
}

export const pipelinesAPI = {
  getAll: (params?: any) => api.get('/pipelines', { params }),
  getById: (id: string) => api.get(`/pipelines/${id}`),
  create: (data: any) => api.post('/pipelines', data),
  getByToken: (token: string) => api.get(`/pipelines/token/${token}`),
  startPipeline: (token: string, data: any) => api.post(`/pipelines/token/${token}/start`, data),
  submitAssessment: (token: string, assessmentId: string, data: any) => 
    api.post(`/pipelines/token/${token}/assessment/${assessmentId}/submit`, data),
  getCandidateProgress: (token: string, candidateId: string) => 
    api.get(`/pipelines/token/${token}/candidate/${candidateId}`),
}

export const questionBanksAPI = {
  getStats: () => api.get('/question-banks/stats'),
  getQuestions: (type: string, params?: any) => api.get(`/question-banks/questions/${type}`, { params }),
  getCategories: () => api.get('/question-banks/categories'),
  getDifficulties: () => api.get('/question-banks/difficulties'),
}
