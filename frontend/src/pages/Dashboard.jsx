import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, AlertCircle, CheckCircle, Clock, Globe,
  Activity, Zap, ArrowRight, ExternalLink, RefreshCw, Brain,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
} from 'recharts'
import { StatCard, AnimatedCounter } from '../components/ui/GlassCard'
import ScoreRing from '../components/ui/ScoreRing'

import { format } from 'date-fns'
import { clsx } from 'clsx'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="custom-tooltip px-4 py-3 rounded-xl"
        style={{ background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(99,102,241,0.3)', backdropFilter: 'blur(16px)' }}>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalAudits: 0,
    avgScore: 0,
    criticalIssues: 0,
    warnings: 0,
    passedChecks: 0,
    improvement: 0,
    avgDuration: 0,
  })
  const [recentAudits, setRecentAudits] = useState([])
  const [chartData, setChartData] = useState([])

  const fetchData = async () => {
    try {
      const { getDashboardStats, getRecentAudits } = await import('../lib/api')
      const [statsData, recentData] = await Promise.all([
        getDashboardStats(),
        getRecentAudits(5)
      ])
      
      setStats({
        ...statsData,
        avgDuration: statsData.avgDuration || 0
      })
      setRecentAudits(recentData.audits || [])
      
      // We don't have historical chart data from backend yet, just use a flatline or empty if no audits
      if (statsData.totalAudits > 0) {
         setChartData([{ month: 'Current', audits: statsData.totalAudits, avgScore: statsData.avgScore }])
      } else {
         setChartData([])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 70) return 'text-indigo-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score) => {
    if (score >= 90) return 'rgba(16,185,129,0.1)'
    if (score >= 70) return 'rgba(99,102,241,0.1)'
    if (score >= 50) return 'rgba(234,179,8,0.1)'
    return 'rgba(239,68,68,0.1)'
  }

  const totalIssues = stats.criticalIssues + stats.warnings + stats.passedChecks || 1 // prevent div by zero
  const pieData = [
    { label: 'Critical', count: stats.criticalIssues, color: '#ef4444', pct: Math.round((stats.criticalIssues / totalIssues) * 100) },
    { label: 'Warnings', count: stats.warnings, color: '#f97316', pct: Math.round((stats.warnings / totalIssues) * 100) },
    { label: 'Passed', count: stats.passedChecks, color: '#10b981', pct: Math.round((stats.passedChecks / totalIssues) * 100) },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your accessibility metrics at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleRefresh}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-ghost text-sm"
          >
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw size={14} />
            </motion.div>
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/new-audit')}
            className="btn-neon text-sm"
          >
            <Zap size={14} /> New Audit
          </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Globe} label="Total Audits" value={stats.totalAudits} color="purple" delay={0} />
        <StatCard icon={BarChart3} label="Avg Score" value={stats.avgScore} suffix="/100" color="blue" delay={0.05} />
        <StatCard icon={AlertCircle} label="Critical Issues" value={stats.criticalIssues} color="red" delay={0.1} />
        <StatCard icon={Activity} label="Warnings" value={stats.warnings} color="yellow" delay={0.15} />
        <StatCard icon={CheckCircle} label="Passed Checks" value={stats.passedChecks} color="green" delay={0.2} />
        <StatCard icon={Clock} label="Avg Duration" value={stats.avgDuration} suffix="s" color="cyan" delay={0.25} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white">Audit Trends</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly audits and average scores</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />Audits
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />Score
              </div>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="auditGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="audits" stroke="#6366f1" strokeWidth={2} fill="url(#auditGrad)" dot={true} />
                <Area type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2} fill="url(#scoreGrad)" dot={true} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">
              No historical data available. Run your first audit!
            </div>
          )}
        </motion.div>

        {/* Score Ring + Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="glass-card p-6 flex flex-col"
        >
          <h3 className="font-bold text-white mb-2">Overall Score</h3>
          <p className="text-xs text-gray-500 mb-6">Across all audited sites</p>
          <div className="flex justify-center mb-6">
            <ScoreRing score={stats.avgScore} size={140} />
          </div>
          <div className="space-y-3">
            {pieData.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-16">{item.label}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: item.color, boxShadow: `0 0 8px ${item.color}80` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <span className="text-xs font-semibold text-white w-10 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Audits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-white">Recent Audits</h3>
            <p className="text-xs text-gray-500 mt-0.5">Latest accessibility scans</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/history')}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        <div className="space-y-3">
          {recentAudits.length > 0 ? recentAudits.map((audit, i) => (
            <motion.div
              key={audit.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}
              onClick={() => navigate(`/dashboard/results/${audit.id}`)}
              className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {/* Score badge */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: getScoreBg(audit.score || 0) }}>
                <span className={getScoreColor(audit.score || 0)}>{audit.score || 0}</span>
              </div>

              {/* URL and meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-white truncate">{audit.url}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span title={audit.createdAt ? format(new Date(audit.createdAt), 'MMM d, yyyy h:mm:ss a') : ''}>
                    {audit.createdAt ? format(new Date(audit.createdAt), 'MMM d, yyyy • h:mm a') : 'just now'}
                  </span>
                  <span>·</span>
                  <span>{audit.duration ? audit.duration.toFixed(1) : '0'}s</span>
                </div>
              </div>

              {/* Issues */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {(audit.issues?.critical > 0 || audit.critical_count > 0) && (
                  <span className="badge-critical">{audit.issues?.critical || audit.critical_count}</span>
                )}
                {((audit.issues?.serious || 0) + (audit.issues?.moderate || 0) > 0 || audit.serious_count > 0) && (
                  <span className="badge-serious">{(audit.issues?.serious || 0) + (audit.issues?.moderate || 0) || audit.serious_count + audit.moderate_count}</span>
                )}
                <span className="badge-minor">{audit.issues?.passes || audit.passes_count || 0} passed</span>
              </div>

              <ExternalLink size={14} className="text-gray-600 flex-shrink-0" />
            </motion.div>
          )) : (
            <div className="py-8 text-center text-sm text-gray-500">
              No recent audits found. Click "New Audit" to get started.
            </div>
          )}
        </div>
      </motion.div>

      {/* AI Insight Banner */}
      {stats.totalAudits > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card p-6 flex items-start gap-4 relative overflow-hidden"
          style={{ border: '1px solid rgba(139,92,246,0.2)' }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(139,92,246,0.08), transparent 60%)' }} />
          <div className="p-3 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Brain size={20} className="text-purple-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-purple-300">AI Insight</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Based on your {stats.totalAudits} audits, your average score is {stats.avgScore}. 
              Run more audits to get deeper AI-powered recommendations.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
