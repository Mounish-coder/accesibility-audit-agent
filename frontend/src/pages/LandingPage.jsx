import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import {
  Shield, Zap, Brain, FileText, CheckCircle, ArrowRight,
  Globe, BarChart3, Lock, Star, ChevronRight, Sparkles,
  AlertCircle, Eye, Code2, Users, TrendingUp, Award,
} from 'lucide-react'
import { getDashboardStats } from '../lib/api'

const features = [
  { icon: Brain, title: 'AI-Powered Analysis', desc: 'Groq LLM categorizes every issue with deep context-aware explanations and actionable recommendations.', color: 'purple' },
  { icon: Zap, title: 'Instant Scanning', desc: 'Axe-Core + Lighthouse detect WCAG 2.1 violations across all pages in seconds.', color: 'blue' },
  { icon: FileText, title: 'Executive Reports', desc: 'Generate polished PDF reports and CSV exports suitable for stakeholders and compliance audits.', color: 'cyan' },
  { icon: Shield, title: 'WCAG 2.1 Compliant', desc: 'Full coverage of Level A, AA, and AAA accessibility guidelines with WCAG cross-references.', color: 'green' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track accessibility scores over time with beautiful animated charts and trend indicators.', color: 'orange' },
  { icon: Globe, title: 'Multi-Page Crawling', desc: 'Crawl entire websites automatically and audit every accessible page in a single run.', color: 'pink' },
]





const colorMap = {
  purple: { base: '139,92,246', hex: '#a78bfa' },
  blue: { base: '59,130,246', hex: '#60a5fa' },
  cyan: { base: '6,182,212', hex: '#22d3ee' },
  green: { base: '16,185,129', hex: '#34d399' },
  orange: { base: '249,115,22', hex: '#fb923c' },
  pink: { base: '236,72,153', hex: '#f472b6' },
}

export default function LandingPage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const [hoveredFeature, setHoveredFeature] = useState(null)
  const [heroStats, setHeroStats] = useState({
    totalAudits: 0,
    avgScore: 0,
    criticalIssues: 0,
    passedChecks: 0,
  })

  useEffect(() => {
    getDashboardStats().then(data => {
      if (data) {
        setHeroStats({
          totalAudits: data.totalAudits || 0,
          avgScore: data.avgScore || 0,
          criticalIssues: data.criticalIssues || 0,
          passedChecks: data.passedChecks || 0,
        })
      }
    }).catch(err => console.error("Failed to fetch dashboard stats", err))
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(8,8,18,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">AccessAI</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          {['Features', 'How it works', 'Pricing'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`}
              className="hover:text-white transition-colors cursor-pointer">{link}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost text-sm hidden md:flex" onClick={() => navigate('/dashboard')}>Sign in</button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="btn-neon text-sm"
          >
            Get Started <ArrowRight size={14} />
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} className="relative px-6 pt-28 pb-24">
        <div className="max-w-5xl mx-auto text-center">

          {/* Scroll-parallax block — text content only */}
          <motion.div style={{ y: heroY, opacity: heroOpacity }}>
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
            >
              <Sparkles size={12} />
              Powered by Groq · Axe-Core · Lighthouse
              <ChevronRight size={12} />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.05] mb-6"
            >
              Accessibility{' '}
              <span className="text-gradient">Auditing</span>
              <br />
              Powered by{' '}
              <span className="relative inline-block">
                <span className="text-gradient">AI</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Scan any website for WCAG violations in seconds. Get AI-generated explanations,
              code fixes, and executive reports — all in one beautiful dashboard.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(99,102,241,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard/new-audit')}
                className="btn-neon text-base px-8 py-4"
              >
                <Zap size={18} />
                Start Free Audit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard')}
                className="btn-ghost text-base px-8 py-4"
              >
                View Dashboard <ArrowRight size={16} />
              </motion.button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-gray-500"
            >
              {['WCAG 2.1 AA', 'SOC 2 Ready', 'GDPR Compliant', 'Open Source'].map(badge => (
                <div key={badge} className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-emerald-500" />
                  {badge}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Dashboard preview — NOT inside the scroll-parallax wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="relative mt-16 w-full max-w-3xl mx-auto z-10"
          >
            <div className="glass-card p-6 w-full"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              {/* Browser chrome bar */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="flex-1 ml-2 px-3 py-1 rounded-md text-xs text-gray-500"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  accessai.app/dashboard
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Total Audits', value: heroStats.totalAudits, color: '#6366f1' },
                  { label: 'Avg Score', value: heroStats.avgScore, color: '#10b981' },
                  { label: 'Critical', value: heroStats.criticalIssues, color: '#ef4444' },
                  { label: 'Passed', value: heroStats.passedChecks >= 1000 ? (heroStats.passedChecks / 1000).toFixed(1) + 'k' : heroStats.passedChecks, color: '#06b6d4' },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-xl text-left"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Category health bars */}
              <div className="space-y-2.5">
                {[
                  { label: 'Images & Media', pct: 88, color: '#10b981' },
                  { label: 'Color & Contrast', pct: 74, color: '#6366f1' },
                  { label: 'Keyboard & Focus', pct: 92, color: '#06b6d4' },
                  { label: 'ARIA & Semantics', pct: 65, color: '#f59e0b' },
                ].map(cat => (
                  <div key={cat.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{cat.label}</span>
                      <span style={{ color: cat.color }}>{cat.pct}</span>
                    </div>
                    <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-1.5 rounded-full"
                        style={{ width: `${cat.pct}%`, background: cat.color, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Glow behind card */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12), transparent 70%)' }} />
          </motion.div>

        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="text-4xl font-black text-gradient mb-2">{heroStats.totalAudits}</div>
                  <div className="text-sm text-gray-400">Sites Audited</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="text-4xl font-black text-gradient mb-2">{heroStats.avgScore}%</div>
                  <div className="text-sm text-gray-400">Avg Accuracy</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="text-4xl font-black text-gradient mb-2">10x</div>
                  <div className="text-sm text-gray-400">Faster Than Manual</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="text-4xl font-black text-gradient mb-2">47</div>
                  <div className="text-sm text-gray-400">WCAG Rules</div>
                </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="tag mb-4 mx-auto w-fit">Features</div>
            <h2 className="text-4xl font-black text-white mb-4">Everything you need<br />for web accessibility</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              A complete platform covering detection, analysis, reporting, and continuous monitoring.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const c = colorMap[feature.color] || colorMap.purple
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onHoverStart={() => setHoveredFeature(i)}
                  onHoverEnd={() => setHoveredFeature(null)}
                  className="glass-card p-6 relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    animate={{ opacity: hoveredFeature === i ? 1 : 0 }}
                    style={{ background: `radial-gradient(circle at 50% -20%, rgba(${c.base},0.08), transparent 60%)` }}
                  />
                  <div className="p-3 rounded-xl w-fit mb-4"
                    style={{
                      background: `rgba(${c.base},0.12)`,
                      border: `1px solid rgba(${c.base},0.25)`,
                      boxShadow: `0 0 16px rgba(${c.base},0.15)`
                    }}>
                    <feature.icon size={20} style={{ color: c.hex }} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="tag mb-4 mx-auto w-fit">Process</div>
            <h2 className="text-4xl font-black text-white mb-4">How it works</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              { step: '01', title: 'Enter your URL', desc: 'Paste any website URL into our scanner. We\'ll handle the rest automatically.', icon: Globe },
              { step: '02', title: 'Automated scanning', desc: 'Axe-Core and Lighthouse crawl your site and detect WCAG violations across every page.', icon: Zap },
              { step: '03', title: 'AI analysis', desc: 'Groq AI categorizes issues, generates plain-English explanations, and suggests exact code fixes.', icon: Brain },
              { step: '04', title: 'Download report', desc: 'Get a polished PDF report with an executive summary, detailed findings, and remediation roadmap.', icon: FileText },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-6 flex items-start gap-6"
              >
                <div className="text-4xl font-black text-gradient opacity-30 min-w-[56px]">{step.step}</div>
                <div className="p-3 rounded-xl flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <step.icon size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass-card p-16 relative overflow-hidden gradient-border"
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12), transparent 60%)' }} />
          <div className="relative z-10">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-4xl font-black text-white mb-4">Ready to make your site accessible?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Start your first audit in under 60 seconds. No credit card required.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/dashboard/new-audit')}
              className="btn-neon text-base px-10 py-4"
            >
              <Zap size={18} />
              Audit your site — it's free
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Shield size={12} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">AccessAI</span>
        </div>
        <p className="text-xs text-gray-600">© 2026 AccessAI · Developed with ❤️ for an accessible web</p>
      </footer>
    </div>
  )
}
