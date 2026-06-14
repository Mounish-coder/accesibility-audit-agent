import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Search, Zap, CheckCircle, AlertCircle, Brain,
  FileText, X, ArrowRight, Loader2, Clock, ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { startAudit, getAuditStatus, cancelAudit as cancelAuditApi, getAuditResults } from '../lib/api'

const SCAN_STEPS = [
  { id: 'crawling', label: 'Crawling site map', icon: 'Globe' },
  { id: 'scanning', label: 'Running WCAG checks', icon: 'Search' },
  { id: 'analyzing', label: 'Analyzing violations', icon: 'Zap' },
  { id: 'intelligence', label: 'Generating AI intelligence', icon: 'Brain' },
  { id: 'saving', label: 'Compiling report', icon: 'FileText' }
]

const stepIcons = { Globe, Search, Zap, Brain, FileText }

export default function NewAudit() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [scanDepth, setScanDepth] = useState('Standard Scan')
  const [wcagLevel, setWcagLevel] = useState('AA')
  const [scanning, setScanning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [stepProgress, setStepProgress] = useState(0)
  const [auditId, setAuditId] = useState(null)
  const [completedResult, setCompletedResult] = useState(null)
  const intervalRef = useRef(null)
  const stepRef = useRef(0)

  const isValidUrl = (u) => {
    try { new URL(u.startsWith('http') ? u : `https://${u}`); return true }
    catch { return false }
  }

  const startScan = async () => {
    if (!url.trim()) { toast.error('Please enter a URL'); return }
    if (!isValidUrl(url)) { toast.error('Please enter a valid URL'); return }

    setScanning(true)
    setCurrentStep(0)
    setStepProgress(0)
    setCompleted(false)
    setCompletedResult(null)
    stepRef.current = 0

    try {
      const depthLimits = {
        'Single Page': 1,
        'Shallow Scan': 10,
        'Standard Scan': 50,
        'Deep Scan': 100,
        'Full Site': 500
      }
      const max_pages = depthLimits[scanDepth] || 50

      const res = await startAudit(url, { max_pages, scan_depth: scanDepth, wcag_level: wcagLevel })

      const parsedRes = typeof res === 'string' ? JSON.parse(res) : (res || {});
      const newAuditId = parsedRes.auditId || parsedRes.audit_id || parsedRes.id || parsedRes.data?.auditId || parsedRes.data?.audit_id || parsedRes.data?.id;

      if (!newAuditId) {
        throw new Error('No audit ID returned from server');
      }

      setAuditId(newAuditId)

      // Poll status
      const pollTimer = setInterval(async () => {
        try {
          const statusRes = await getAuditStatus(newAuditId)
          if (statusRes.status === 'completed') {
            clearInterval(pollTimer)
            setStepProgress(100)
            setCurrentStep(SCAN_STEPS.length)

            try {
              const realResults = await getAuditResults(newAuditId)
              setCompletedResult(realResults)
            } catch (err) {
              console.error("Failed to fetch final results", err)
            }

            setCompleted(true)
            toast.success('Audit completed successfully!')
          } else if (statusRes.status === 'failed') {
            clearInterval(pollTimer)
            setScanning(false)
            toast.error('Audit failed: ' + (statusRes.error || 'Unknown error'))
          } else {
            setStepProgress(statusRes.progress || 0)
            const stepMap = { 'crawling': 0, 'scanning': 1, 'analyzing': 2, 'intelligence': 3, 'saving': 4 }
            if (statusRes.step && stepMap[statusRes.step] !== undefined) {
              setCurrentStep(stepMap[statusRes.step])
            }
          }
        } catch (err) {
          console.error(err)
        }
      }, 2000)
      intervalRef.current = pollTimer
    } catch (err) {
      toast.error('Failed to start audit: ' + err.message)
      setScanning(false)
    }
  }

  const cancelScan = async () => {
    clearInterval(intervalRef.current)
    if (auditId) {
      try {
        await cancelAuditApi(auditId)
      } catch (e) {
        console.error("Cancel failed", e)
      }
    }
    setScanning(false)
    setCurrentStep(0)
    setStepProgress(0)
    setCompleted(false)
    toast('Audit cancelled', { icon: '⚠️' })
  }

  const viewResults = () => navigate(`/dashboard/results/${auditId}`)

  const recentUrls = []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white mb-1">New Accessibility Audit</h2>
        <p className="text-sm text-gray-400">Scan any website for WCAG violations in seconds</p>
      </motion.div>

      {/* URL Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 space-y-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.08), transparent 60%)' }} />

        <div className="relative z-10">
          <label htmlFor="audit-url" className="block text-sm font-semibold text-white mb-3">
            Website URL
          </label>
          <div className="relative">
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              id="audit-url"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !scanning && startScan()}
              placeholder="https://your-website.com"
              className="glass-input pl-10 pr-4 w-full"
              disabled={scanning}
              autoFocus
            />
          </div>

          {/* Recent URLs */}
          {!scanning && !completed && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Quick select:</span>
              {recentUrls.map(u => (
                <motion.button
                  key={u}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUrl(u)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#a5b4fc' }}
                >
                  {u.replace('https://', '')}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        {!scanning && !completed && (
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Scan Depth</label>
              <select
                value={scanDepth}
                onChange={(e) => setScanDepth(e.target.value)}
                className="glass-input w-full p-2.5 text-sm appearance-none cursor-pointer"
              >
                <option value="Single Page" className="bg-gray-900">Single Page</option>
                <option value="Shallow Scan" className="bg-gray-900">Shallow Scan (Max 10)</option>
                <option value="Standard Scan" className="bg-gray-900">Standard Scan (Max 50)</option>
                <option value="Deep Scan" className="bg-gray-900">Deep Scan (Max 100)</option>
                <option value="Full Site" className="bg-gray-900">Full Site</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">WCAG Level</label>
              <select
                value={wcagLevel}
                onChange={(e) => setWcagLevel(e.target.value)}
                className="glass-input w-full p-2.5 text-sm appearance-none cursor-pointer"
              >
                <option value="A" className="bg-gray-900">A only</option>
                <option value="AA" className="bg-gray-900">AA (recommended)</option>
                <option value="AAA" className="bg-gray-900">AAA</option>
              </select>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="relative z-10">
          {!scanning && !completed ? (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={startScan}
              className="btn-neon w-full justify-center py-4 text-base mt-2"
            >
              <Zap size={18} />
              Start Accessibility Audit
            </motion.button>
          ) : completed ? (
            <div className="flex gap-3 mt-2">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={viewResults}
                className="btn-neon flex-1 justify-center py-4 text-base"
              >
                View Results <ArrowRight size={16} />
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => { setScanning(false); setCompleted(false); setUrl('') }}
                className="btn-ghost px-6"
              >
                New Audit
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={cancelScan}
              className="btn-ghost w-full justify-center py-4 text-red-400 border-red-400/20 mt-2"
            >
              <X size={16} /> Cancel Scan
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Scan Progress */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="glass-card p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Scanning {url}</h3>
              {completed ? (
                <span className="badge-pass">
                  <CheckCircle size={11} /> Complete
                </span>
              ) : (
                <span className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 size={13} className="animate-spin text-indigo-400" />
                  In progress...
                </span>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {SCAN_STEPS.map((step, i) => {
                const isDone = completed || i < currentStep
                const isActive = !completed && i === currentStep
                const isPending = !completed && i > currentStep
                const Icon = stepIcons[step.icon] || Zap

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={clsx(
                      'flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300',
                      isActive && 'scan-animation',
                    )}
                    style={{
                      background: isDone ? 'rgba(16,185,129,0.06)' : isActive ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)'}`,
                    }}
                  >
                    {/* Step icon */}
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                    )}
                      style={{
                        background: isDone ? 'rgba(16,185,129,0.15)' : isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      }}>
                      {isDone ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle size={16} className="text-emerald-400" />
                        </motion.div>
                      ) : isActive ? (
                        <Loader2 size={16} className="text-indigo-400 animate-spin" />
                      ) : (
                        <Icon size={14} className="text-gray-600" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1">
                      <span className={clsx(
                        'text-sm font-medium',
                        isDone ? 'text-emerald-300' : isActive ? 'text-white' : 'text-gray-500'
                      )}>
                        {step.label}
                      </span>
                      {isActive && (
                        <div className="progress-bar mt-2">
                          <motion.div
                            className="progress-fill"
                            style={{ width: `${stepProgress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {isDone && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-emerald-400"
                      >
                        Done
                      </motion.span>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Overall progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Overall progress</span>
                <span>
                  {completed
                    ? '100%'
                    : `${Math.round(((currentStep + stepProgress / 100) / SCAN_STEPS.length) * 100)}%`
                  }
                </span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  animate={{
                    width: completed
                      ? '100%'
                      : `${((currentStep + stepProgress / 100) / SCAN_STEPS.length) * 100}%`
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed result preview */}
      <AnimatePresence>
        {completed && completedResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-6"
            style={{ border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Audit Complete!</h3>
                <p className="text-xs text-gray-500">Found {completedResult.summary?.total || 0} issues across {completedResult.pages || 0} pages</p>
              </div>
              <div className="ml-auto text-4xl font-black text-indigo-400">{completedResult.score || 0}</div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Critical', count: completedResult.summary?.critical || 0, color: '#ef4444' },
                { label: 'Serious', count: completedResult.summary?.serious || 0, color: '#f97316' },
                { label: 'Moderate', count: completedResult.summary?.moderate || 0, color: '#eab308' },
                { label: 'Passed', count: completedResult.summary?.passes || 0, color: '#10b981' },
              ].map(item => (
                <div key={item.label} className="text-center p-3 rounded-xl"
                  style={{ background: `${item.color}14`, border: `1px solid ${item.color}30` }}>
                  <div className="text-xl font-bold" style={{ color: item.color }}>{item.count}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
