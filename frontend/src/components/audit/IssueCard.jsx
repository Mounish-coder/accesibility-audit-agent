import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertTriangle, AlertCircle, Info, CheckCircle, Code2, Lightbulb, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const severityConfig = {
  critical: {
    badge: 'badge-critical',
    icon: AlertCircle,
    dot: 'bg-red-500',
    glow: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.2)',
    label: 'Critical',
  },
  serious: {
    badge: 'badge-serious',
    icon: AlertTriangle,
    dot: 'bg-orange-500',
    glow: 'rgba(249,115,22,0.15)',
    border: 'rgba(249,115,22,0.2)',
    label: 'Serious',
  },
  moderate: {
    badge: 'badge-moderate',
    icon: Info,
    dot: 'bg-yellow-500',
    glow: 'rgba(234,179,8,0.15)',
    border: 'rgba(234,179,8,0.2)',
    label: 'Moderate',
  },
  minor: {
    badge: 'badge-minor',
    icon: CheckCircle,
    dot: 'bg-emerald-500',
    glow: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.2)',
    label: 'Minor',
  },
}

export default function IssueCard({ issue, index = 0 }) {
  const [open, setOpen] = useState(false)
  const config = severityConfig[issue.severity] || severityConfig.moderate
  const SeverityIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl overflow-hidden border transition-all duration-300"
      style={{
        background: open ? config.glow : 'rgba(255,255,255,0.03)',
        borderColor: open ? config.border : 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-start gap-4 p-5 text-left group"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="mt-0.5 flex-shrink-0">
          <SeverityIcon size={18} className={clsx(
            issue.severity === 'critical' && 'text-red-400',
            issue.severity === 'serious' && 'text-orange-400',
            issue.severity === 'moderate' && 'text-yellow-400',
            issue.severity === 'minor' && 'text-emerald-400',
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={config.badge}>{config.label}</span>
            {issue.wcag && <span className="tag">{issue.wcag}</span>}
            {issue.category && <span className="tag">{issue.category}</span>}
          </div>
          <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors leading-snug">
            {issue.description}
          </h4>
          {issue.element && (
            <code className="text-xs text-gray-500 font-mono mt-1 block truncate">
              {issue.element}
            </code>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-gray-500"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
              {/* AI Explanation */}
              {issue.aiExplanation && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                    <Lightbulb size={13} />
                    AI Explanation
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{issue.aiExplanation}</p>
                </div>
              )}

              {/* Recommendation */}
              {issue.recommendation && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle size={13} />
                    Recommended Fix
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{issue.recommendation}</p>
                </div>
              )}

              {/* Code Example */}
              {issue.codeExample && (
                <div>
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Code2 size={13} />
                    Code Example
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/5">
                    <SyntaxHighlighter
                      language="html"
                      style={atomDark}
                      customStyle={{
                        margin: 0,
                        background: 'rgba(0,0,0,0.4)',
                        fontSize: '12px',
                        padding: '16px',
                      }}
                    >
                      {issue.codeExample}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}

              {/* Help URL */}
              {issue.helpUrl && (
                <a
                  href={issue.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <ExternalLink size={12} />
                  Learn more about this rule
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
