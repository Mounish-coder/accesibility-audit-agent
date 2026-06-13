import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export default function ProgressBar({ value, max = 100, color = 'purple', label, showValue = true, animated = true, className = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  const colors = {
    purple: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    green: 'linear-gradient(90deg, #10b981, #34d399)',
    red: 'linear-gradient(90deg, #ef4444, #f87171)',
    orange: 'linear-gradient(90deg, #f59e0b, #fb923c)',
    blue: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
    cyan: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
  }

  const glows = {
    purple: 'rgba(99,102,241,0.5)',
    green: 'rgba(16,185,129,0.5)',
    red: 'rgba(239,68,68,0.5)',
    orange: 'rgba(245,158,11,0.5)',
    blue: 'rgba(59,130,246,0.5)',
    cyan: 'rgba(6,182,212,0.5)',
  }

  return (
    <div className={clsx('space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-sm text-gray-400 font-medium">{label}</span>}
          {showValue && <span className="text-sm font-semibold text-white">{pct}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={animated ? { width: '0%' } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          style={{
            background: colors[color] || colors.purple,
            boxShadow: `0 0 10px ${glows[color] || glows.purple}`,
          }}
        />
      </div>
    </div>
  )
}
