import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import NewAudit from './pages/NewAudit'
import AuditHistory from './pages/AuditHistory'
import AuditResults from './pages/AuditResults'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import MeshBackground from './components/ui/MeshBackground'

export default function App() {
  return (
    <BrowserRouter>
      <MeshBackground />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 15, 30, 0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#080812' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#080812' },
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="new-audit" element={<NewAudit />} />
            <Route path="history" element={<AuditHistory />} />
            <Route path="results/:auditId" element={<AuditResults />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
