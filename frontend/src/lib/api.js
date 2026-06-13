import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// Audit endpoints
export const startAudit = (url, options = {}) => api.post('/audit/start', { url, ...options })
export const getAuditStatus = (auditId) => api.get(`/audit/${auditId}/status`)
export const getAuditResults = (auditId) => api.get(`/audit/${auditId}/results`)
export const cancelAudit = (auditId) => api.post(`/audit/${auditId}/cancel`)
export const getAuditHistory = (params = {}) => api.get('/audit/history', { params })

// Dashboard endpoints
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getRecentAudits = (limit = 5) => api.get('/dashboard/recent', { params: { limit } })

// Report endpoints
export const generateReport = (auditId, format) => api.post(`/reports/${auditId}/generate`, { format })
export const downloadReport = (reportId) => `/api/reports/${reportId}/download`
export const getReports = () => api.get('/reports')

// Settings
export const getSettings = () => api.get('/settings')
export const updateSettings = (data) => api.put('/settings', data)

export default api
