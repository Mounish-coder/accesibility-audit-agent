import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

console.log('[API CONFIG] Axios baseURL is set to:', api.defaults.baseURL);

// Response interceptor: unwrap response.data so callers get the payload directly.
// If the response body is empty or unparseable, return {} rather than throwing.
api.interceptors.response.use(
  (response) => {
    // axios already parses JSON; response.data is the parsed object.
    // Guard against null/empty so downstream code always gets an object.
    console.log(`[API RESPONSE] ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response.data ?? {}
  },
  (error) => {
    console.error('[API ERROR] Response Error:', error.response?.status, error.message);
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// Audit endpoints
export const startAudit = (url, options = {}) => {
  console.log('[API CALL] startAudit called with URL:', url, 'Options:', options);
  console.log('[API CALL] Final POST request will be to:', `${api.defaults.baseURL}/audit/start`);
  return api.post('/audit/start', { url, ...options })
}

export const getAuditStatus = (auditId) =>
  api.get(`/audit/${auditId}/status`)

export const getAuditResults = (auditId) =>
  api.get(`/audit/${auditId}/results`)

export const cancelAudit = (auditId) =>
  api.post(`/audit/${auditId}/cancel`)

export const getAuditHistory = (params = {}) =>
  api.get('/audit/history', { params })

// Dashboard endpoints
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getRecentAudits = (limit = 5) =>
  api.get('/dashboard/recent', { params: { limit } })

// Report endpoints
export const generateReport = (auditId, format) =>
  api.post(`/reports/${auditId}/generate`, { format })
export const downloadReport = (reportId) => `/api/reports/${reportId}/download`
export const getReports = () => api.get('/reports')

// Settings
export const getSettings = () => api.get('/settings')
export const updateSettings = (data) => api.put('/settings', data)

export default api
