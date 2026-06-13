import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

// Animated number counter hook
export function useCounter(to, duration = 1.5) {
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    let start = null
    const step = (timestamp) => {
      if (!start) start = timestamp
      const elapsed = (timestamp - start) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * to))
      if (progress < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [to, duration])

  return value
}

// Animated counter component
export function AnimatedCounter({ value, suffix = '', prefix = '', className = '' }) {
  const displayValue = useCounter(typeof value === 'number' ? value : 0)
  return (
    <span className={clsx('tabular-nums', className)}>
      {prefix}{typeof value === 'number' ? displayValue : value}{suffix}
    </span>
  )
}

// Glass Card base
export default function GlassCard({ children, className = '', gradient = false, onClick, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className={clsx(
        'glass-card',
        gradient && 'gradient-border',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Stat Card
export function StatCard({ icon: Icon, label, value, change, color = 'purple', delay = 0, suffix = '', prefix = '' }) {
  const colorMap = {
    purple: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', glow: 'rgba(139,92,246,0.2)', text: '#a78bfa', ambient: 'rgba(139,92,246,0.06)' },
    blue:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  glow: 'rgba(59,130,246,0.2)',  text: '#60a5fa', ambient: 'rgba(59,130,246,0.06)' },
    green:  { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  glow: 'rgba(16,185,129,0.2)',  text: '#34d399', ambient: 'rgba(16,185,129,0.06)' },
    red:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   glow: 'rgba(239,68,68,0.2)',   text: '#f87171', ambient: 'rgba(239,68,68,0.06)' },
    cyan:   { bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.25)',   glow: 'rgba(6,182,212,0.2)',   text: '#22d3ee', ambient: 'rgba(6,182,212,0.06)' },
    yellow: { bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.25)',   glow: 'rgba(234,179,8,0.2)',   text: '#facc15', ambient: 'rgba(234,179,8,0.06)' },
  }
  const c = colorMap[color] || colorMap.purple

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
      className="glass-card p-6 flex flex-col gap-4 group relative overflow-hidden"
    >
      {/* Ambient glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{ background: `radial-gradient(circle at 50% -20%, ${c.ambient}, transparent 60%)` }}
      />

      <div className="flex items-start justify-between relative z-10">
        <motion.div
          className="p-3 rounded-xl"
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400 }}
          style={{ background: c.bg, border: `1px solid ${c.border}`, boxShadow: `0 0 16px ${c.glow}` }}
        >
          <Icon size={20} style={{ color: c.text }} />
        </motion.div>
        {change !== undefined && (
          <span className={clsx(
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            change >= 0 ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'
          )}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>

      <div className="relative z-10">
        <div className="text-3xl font-bold text-white">
          <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
        </div>
        <p className="text-sm text-gray-400 mt-1 font-medium">{label}</p>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${c.text}, transparent)` }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.6 }}
      />
    </motion.div>
  )
}
