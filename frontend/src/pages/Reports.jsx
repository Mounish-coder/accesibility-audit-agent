import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Loader2, CheckCircle, Calendar,
  Globe, BarChart3, FileSpreadsheet, BookOpen, Zap,
  Clock, ExternalLink, Eye,
} from 'lucide-react'
import { getAuditHistory, generateReport } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const reportTypes = [
  {
    id: 'pdf',
    icon: FileText,
    title: 'Full PDF Report',
    desc: 'Comprehensive report with all issues, AI explanations, and code fixes. Perfect for developers.',
    format: 'PDF',
    color: 'purple',
    size: '~2.4 MB',
  },
  {
    id: 'executive',
    icon: BookOpen,
    title: 'Executive Summary',
    desc: 'One-page overview with score, key findings, and compliance status. For stakeholders and management.',
    format: 'PDF',
    color: 'blue',
    size: '~0.8 MB',
  },
  {
    id: 'csv',
    icon: FileSpreadsheet,
    title: 'CSV Export',
    desc: 'Raw data export of all issues with metadata. Import into spreadsheets or issue trackers.',
    format: 'CSV',
    color: 'green',
    size: '~0.1 MB',
  },
  {
    id: 'scorecard',
    icon: BarChart3,
    title: 'Accessibility Scorecard',
    desc: 'Visual scorecard with category breakdowns and trend charts. Great for progress tracking.',
    format: 'PDF',
    color: 'cyan',
    size: '~1.2 MB',
  },
]

export default function Reports() {
  const [generating, setGenerating] = useState(null)
  const [recentAudits, setRecentAudits] = useState([])
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [generated, setGenerated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const data = await getAuditHistory({ limit: 4 })
        setRecentAudits(data.audits || [])
        if (data.audits?.length > 0) setSelectedAudit(data.audits[0])
      } catch (err) {
        toast.error('Failed to load recent audits')
      } finally {
        setLoading(false)
      }
    }
    fetchAudits()
  }, [])

  const handleGenerate = async (reportType) => {
    if (!selectedAudit) return
    setGenerating(reportType.id)
    
    try {
      const res = await generateReport(selectedAudit.id, reportType.id)
      
      // Download the file
      window.open(`/api${res.downloadUrl}`, '_blank')

      setGenerated(prev => [{ id: Date.now(), type: reportType.title, format: reportType.format, date: new Date() }, ...prev])
      toast.success(`${reportType.title} generated successfully!`)
    } catch (e) {
      toast.error('Failed to generate report')
    }

    setGenerating(null)
  }

  const colorMap = {
    purple: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', text: '#a78bfa' },
    blue: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', text: '#60a5fa' },
    green: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#34d399' },
    cyan: { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', text: '#22d3ee' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white mb-1">Report Center</h2>
        <p className="text-sm text-gray-400">Generate and download AI-powered accessibility reports</p>
      </motion.div>

      {/* Audit selector */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold text-white mb-3">Select Audit</h3>
        {loading ? (
          <div className="text-gray-400 text-sm">Loading audits...</div>
        ) : recentAudits.length === 0 ? (
          <div className="text-gray-400 text-sm">No recent audits found. Run a scan first!</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {recentAudits.map(audit => (
              <motion.button
                key={audit.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAudit(audit)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: selectedAudit?.id === audit.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedAudit?.id === audit.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className="text-xs text-white font-medium truncate mb-1">{audit.url.replace('https://', '')}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400">{audit.score || 'N/A'}</span>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-gray-500" title={audit.createdAt ? format(new Date(audit.createdAt), 'MMM d, yyyy h:mm:ss a') : ''}>
                    {audit.createdAt ? format(new Date(audit.createdAt), 'MMM d, yyyy • h:mm a') : 'Unknown'}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Report type cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {reportTypes.map((rt, i) => {
          const c = colorMap[rt.color] || colorMap.purple
          const isGenerating = generating === rt.id

          return (
            <motion.div
              key={rt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 relative overflow-hidden group"
            >
              <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at 50% -20%, ${c.bg}, transparent 60%)` }} />

              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 rounded-xl flex-shrink-0"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <rt.icon size={20} style={{ color: c.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-sm">{rt.title}</h3>
                    <span className="tag text-xs">{rt.format}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">{rt.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{rt.size}</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleGenerate(rt)}
                      disabled={isGenerating || !selectedAudit}
                      className={isGenerating ? 'btn-ghost opacity-60 cursor-wait' : 'btn-neon text-xs px-4 py-2'}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          Generate
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Recent downloads */}
      <AnimatePresence>
        {generated.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-white mb-4">Recent Downloads</h3>
            <div className="space-y-3">
              {generated.map(g => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-3 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                >
                  <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{g.type}</div>
                    <div className="text-xs text-gray-500">{format(g.date, 'MMM d, yyyy • h:mm a')}</div>
                  </div>
                  <span className="tag">{g.format}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
