import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Clock, ArrowLeft, Download, Share2, RefreshCw,
  AlertCircle, AlertTriangle, Info, CheckCircle, Brain,
  Filter, BarChart3, ChevronDown, Layers, Search
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import ScoreRing from '../components/ui/ScoreRing'
import ProgressBar from '../components/ui/ProgressBar'
import IssueCard from '../components/audit/IssueCard'
import { getAuditResults } from '../lib/api'
import { clsx } from 'clsx'
import { format } from 'date-fns'

const categories = [
  { id: 'all', label: 'All Issues' },
  { id: 'clusters', label: '✨ AI Clusters' },
  { id: 'critical', label: 'Critical' },
  { id: 'serious', label: 'Serious' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'minor', label: 'Minor' },
]

function ClusterCard({ cluster, index }) {
  const [open, setOpen] = useState(false)
  const severityColors = {
    critical: 'text-red-400 bg-red-400/10 border-red-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  }
  const colorClass = severityColors[cluster.severity] || severityColors.medium

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-xl overflow-hidden border transition-all"
      style={{
        background: open ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        borderColor: open ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'
      }}
    >
      <button className="w-full flex items-start gap-4 p-5 text-left group" onClick={() => setOpen(!open)}>
        <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
             <span className={clsx("text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border", colorClass)}>
               {cluster.severity}
             </span>
             {cluster.wcagGuideline && <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">{cluster.wcagGuideline}</span>}
             <span className="text-xs text-gray-500">• {cluster.issues?.length || 0} Issues</span>
           </div>
           <h4 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">{cluster.name}</h4>
           <p className="text-gray-400 text-sm mt-1">{cluster.impact}</p>
        </div>
        <ChevronDown size={16} className={clsx("text-gray-500 transition-transform mt-2", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="p-5 pt-0 space-y-4 border-t border-white/5 mt-2">
               <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                 <h5 className="text-xs font-bold text-purple-400 mb-1 flex items-center gap-2"><Brain size={14}/> AI Explanation</h5>
                 <p className="text-sm text-gray-300 leading-relaxed">{cluster.explanation}</p>
               </div>
               <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                 <h5 className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-2"><CheckCircle size={14}/> Recommendation</h5>
                 <p className="text-sm text-gray-300 leading-relaxed">{cluster.recommendation}</p>
               </div>
               {cluster.codeExample && (
                 <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                   <h5 className="text-xs font-bold text-blue-400 mb-2">Code Example</h5>
                   <pre className="text-xs text-gray-300 overflow-x-auto"><code>{cluster.codeExample}</code></pre>
                 </div>
               )}
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AuditResults() {
  const { auditId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('clusters')
  const [showAI, setShowAI] = useState(true)
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        const data = await getAuditResults(auditId)
        if (data.status === 'failed') {
          throw new Error(data.message || 'Audit failed')
        }
        setAudit(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [auditId])

  if (loading) return <div className="flex flex-col items-center justify-center h-64 text-purple-400"><RefreshCw className="animate-spin mb-4" size={32} /> <p>Loading Intelligence Data...</p></div>
  if (error) return <div className="p-6 glass-card border-red-500/30 text-red-400 text-center">Error: {error}</div>
  if (!audit) return null

  const filteredIssues = (audit.issues || []).filter(issue =>
    activeTab === 'all' ? true : activeTab === 'clusters' ? false : issue.severity === activeTab
  )

  const summaryItems = [
    { label: 'Critical', count: audit.summary?.critical || audit.critical_count || 0, color: 'red', icon: AlertCircle },
    { label: 'Serious', count: audit.summary?.serious || audit.serious_count || 0, color: 'orange', icon: AlertTriangle },
    { label: 'Moderate', count: audit.summary?.moderate || audit.moderate_count || 0, color: 'yellow', icon: Info },
    { label: 'Minor', count: audit.summary?.minor || 0, color: 'green', icon: CheckCircle },
    { label: 'Passed', count: audit.summary?.passes || audit.passes_count || 0, color: 'cyan', icon: CheckCircle },
  ]

  const radarData = Object.entries(audit.categories || {}).map(([cat, data]) => ({
    subject: cat,
    score: data.score
  }))

  const ai = audit.aiIntelligence || audit.ai_intelligence || null

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost mt-1 px-3 py-2">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white mb-1 truncate">{audit.url}</h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock size={11} /> {audit.duration?.toFixed(1) || 0}s scan</span>
            {audit.scanDepth && <span className="flex items-center gap-1"><Search size={11} /> {audit.scanDepth}</span>}
            <span className="flex items-center gap-1"><Globe size={11} /> {audit.pages || 0} {audit.maxPages ? `/ ${audit.maxPages}` : ''} pages</span>
            {audit.createdAt && (
              <span className="flex items-center gap-1" title={format(new Date(audit.createdAt), 'MMM d, yyyy h:mm:ss a')}>
                • {format(new Date(audit.createdAt), 'MMM d, yyyy h:mm a')}
              </span>
            )}
            <span className={clsx("badge-pass", audit.status === 'failed' && "badge-critical", audit.status === 'running' && "badge-moderate")}>
              {audit.status === 'failed' ? <AlertCircle size={11} /> : audit.status === 'running' ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle size={11} />} {audit.status || 'Completed'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn-ghost text-sm"><Share2 size={14} /> Share</button>
          <button
            onClick={() => navigate('/dashboard/reports')}
            className="btn-neon text-sm"
          >
            <Download size={14} /> Download Report
          </button>
        </div>
      </motion.div>

      {/* Score + Summary Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 flex flex-col items-center gap-4"
        >
          <h3 className="font-bold text-white text-sm">Accessibility Score</h3>
          <ScoreRing score={audit.score || 0} size={160} />
          <div className="w-full space-y-2 mt-2">
            <ProgressBar value={audit.score || 0} color="purple" label="Overall" />
          </div>
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 space-y-3 overflow-y-auto max-h-[280px]"
        >
          <h3 className="font-bold text-white mb-4">Category Scores</h3>
          {Object.entries(audit.categories || {}).length === 0 && <p className="text-gray-500 text-sm">No category data.</p>}
          {Object.entries(audit.categories || {}).map(([cat, data], i) => (
            <div key={cat} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{cat}</span>
                <span className="text-white font-medium">{data.score}</span>
              </div>
              <ProgressBar
                value={data.score}
                color={data.score >= 80 ? 'green' : data.score >= 60 ? 'purple' : 'red'}
                showValue={false}
                animated
              />
            </div>
          ))}
        </motion.div>

        {/* Radar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="font-bold text-white mb-4">Coverage Radar</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                <RechartsTooltip
                  contentStyle={{ background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#a5b4fc' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">Insufficient data</div>
          )}
        </motion.div>
      </div>

      {/* Issue count row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-5 gap-3"
      >
        {summaryItems.map((item, i) => {
          const colorMap = {
            red: { text: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
            orange: { text: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
            yellow: { text: '#facc15', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)' },
            green: { text: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            cyan: { text: '#22d3ee', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
          }
          const c = colorMap[item.color]
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="glass-card p-4 text-center"
              style={{ borderColor: c.border }}
            >
              <div className="text-2xl font-black" style={{ color: c.text }}>{item.count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* AI Analysis Panel */}
      {ai && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card overflow-hidden"
          style={{ border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 40px rgba(139,92,246,0.05)' }}
        >
          <button
            onClick={() => setShowAI(!showAI)}
            className="w-full flex items-center gap-4 p-5 hover:bg-white/5 transition-colors"
          >
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Brain size={20} className="text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-white text-lg">AI Executive Summary</h3>
              <p className="text-sm text-purple-300/70">{ai.executiveSummary?.headline || 'Groq-powered accessibility intelligence'}</p>
            </div>
            <motion.div animate={{ rotate: showAI ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={20} className="text-gray-400" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showAI && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-6 pb-6 border-t border-purple-500/10 pt-4 space-y-4">
                  <div className="p-5 rounded-xl space-y-3" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2"><Brain size={14}/> Assessment</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {ai.executiveSummary?.summary}
                    </p>
                    {ai.executiveSummary?.riskStatement && (
                      <p className="text-xs text-red-300/80 border-l-2 border-red-500/50 pl-3 mt-2 py-1">
                        {ai.executiveSummary.riskStatement}
                      </p>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle size={14}/> Quick Wins</h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        {(ai.executiveSummary?.quickWins || []).map((win, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">•</span> <span>{win}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-5 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2"><Layers size={14}/> Remediation Roadmap</h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        {(ai.executiveSummary?.complianceRoadmap || []).map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">{i+1}.</span> <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Issues List */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-4"
      >
        {/* Tab filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => {
            if (cat.id === 'clusters' && (!ai || !ai.clusters || ai.clusters.length === 0)) return null;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(cat.id)}
                className={clsx(
                  'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2',
                  activeTab === cat.id
                    ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                    : 'btn-ghost'
                )}
              >
                {cat.label}
                <span className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-md min-w-[20px] text-center font-bold',
                  activeTab === cat.id ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-gray-400'
                )}>
                  {cat.id === 'all' ? (audit.issues || []).length : 
                   cat.id === 'clusters' ? ai?.clusters?.length || 0 :
                   (audit.issues || []).filter(i => i.severity === cat.id).length}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Issue cards / Clusters */}
        <div className="space-y-3">
          {activeTab === 'clusters' ? (
            ai?.clusters?.map((cluster, i) => (
              <ClusterCard key={cluster.id || i} cluster={cluster} index={i} />
            ))
          ) : filteredIssues.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <CheckCircle size={36} className="text-emerald-400 mx-auto mb-3 opacity-60" />
              <p className="text-gray-400">No {activeTab} issues found</p>
            </div>
          ) : (
            filteredIssues.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
