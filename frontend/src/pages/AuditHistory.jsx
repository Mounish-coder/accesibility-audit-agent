import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe, Clock, ExternalLink, Search, Filter, Download,
  CheckCircle, AlertCircle, ChevronRight, BarChart3, Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { clsx } from 'clsx'

export default function AuditHistory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { getAuditHistory } = await import('../lib/api')
        const data = await getAuditHistory()
        setAudits(data.audits || [])
      } catch (error) {
        console.error('Failed to fetch audit history:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const filtered = audits.filter(a => {
    const matchSearch = a.url?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ? true :
      filter === 'critical' ? (a.issues?.critical > 0 || a.critical_count > 0) :
      filter === 'clean' ? ((a.issues?.critical === 0 && a.score >= 80) || (a.critical_count === 0 && a.score >= 80)) :
      true
    return matchSearch && matchFilter
  })

  const getScoreColor = (score) => {
    if (score >= 90) return { text: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' }
    if (score >= 70) return { text: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)' }
    if (score >= 50) return { text: '#facc15', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.2)' }
    return { text: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.2)' }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="skeleton h-16 rounded-xl" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white mb-1">Audit History</h2>
        <p className="text-sm text-gray-400">{audits.length} total audits</p>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by URL..."
            className="glass-input pl-9 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'critical', label: 'Has Critical' },
            { value: 'clean', label: 'Clean (80+)' },
          ].map(f => (
            <motion.button
              key={f.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(f.value)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === f.value
                  ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                  : 'btn-ghost'
              )}
            >
              {f.label}
            </motion.button>
          ))}
        </div>
        <button className="btn-ghost text-sm ml-auto">
          <Download size={14} /> Export CSV
        </button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card overflow-hidden"
      >
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-white/5">
          <div className="col-span-4">URL</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-3">Issues</div>
          <div className="col-span-2 text-center">Depth</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p>{audits.length === 0 ? "No audits available yet. Run your first audit!" : "No audits match your search"}</p>
            </div>
          ) : (
            filtered.map((audit, i) => {
              const sc = getScoreColor(audit.score || 0)
              return (
                <motion.div
                  key={audit.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/dashboard/results/${audit.id}`)}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 cursor-pointer transition-colors items-center"
                >
                  {/* URL */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Globe size={14} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-white font-medium truncate">{audit.url}</span>
                  </div>

                  {/* Score */}
                  <div className="col-span-1 flex justify-center">
                    <span className="text-sm font-bold px-2.5 py-1 rounded-lg"
                      style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      {audit.score || 0}
                    </span>
                  </div>

                  {/* Issues */}
                  <div className="col-span-3 flex items-center gap-2 flex-wrap">
                    {(audit.issues?.critical > 0 || audit.critical_count > 0) && <span className="badge-critical">{audit.issues?.critical || audit.critical_count} critical</span>}
                    {(audit.issues?.serious > 0 || audit.serious_count > 0) && <span className="badge-serious">{audit.issues?.serious || audit.serious_count} serious</span>}
                    {(audit.issues?.moderate > 0 || audit.moderate_count > 0) && <span className="badge-moderate">{audit.issues?.moderate || audit.moderate_count} moderate</span>}
                    {((audit.issues?.critical === 0 && audit.issues?.serious === 0) || (audit.critical_count === 0 && audit.serious_count === 0)) && (
                      <span className="badge-pass"><CheckCircle size={10} /> Clean</span>
                    )}
                  </div>

                  {/* Depth */}
                  <div className="col-span-2 flex justify-center">
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                      {audit.scanDepth || 'Standard Scan'}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="col-span-2">
                    <div className="text-xs text-gray-300" title={audit.createdAt ? format(new Date(audit.createdAt), 'MMM d, yyyy h:mm:ss a') : ''}>
                      {audit.createdAt ? format(new Date(audit.createdAt), 'MMM d, yyyy • h:mm a') : 'just now'}
                    </div>
                    <div className="text-xs text-gray-600">{audit.createdAt ? format(new Date(audit.createdAt), 'MMM d, yyyy') : ''}</div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end">
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </motion.div>
    </div>
  )
}
