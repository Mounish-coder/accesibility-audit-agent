import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Key, Bell, Shield, Palette, Globe, Save, Eye, EyeOff,
  ChevronRight, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const sections = [
  {
    id: 'api',
    icon: Key,
    title: 'API Configuration',
    desc: 'Configure AI and service credentials',
    color: 'purple',
  },
  {
    id: 'scan',
    icon: Globe,
    title: 'Scan Settings',
    desc: 'Customize scanning behavior',
    color: 'blue',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    desc: 'Email and webhook alerts',
    color: 'cyan',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security',
    desc: 'Access control and privacy',
    color: 'green',
  },
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('api')
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [settings, setSettings] = useState({
    groqApiKey: 'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    wcagLevel: 'AA',
    maxPages: '10',
    timeout: '30',
    emailNotifications: true,
    webhookUrl: '',
    autoReport: false,
    includePassedChecks: true,
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    setSaving(false)
    toast.success('Settings saved successfully!')
  }

  const colorMap = {
    purple: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', text: '#a78bfa' },
    blue: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', text: '#60a5fa' },
    cyan: { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', text: '#22d3ee' },
    green: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#34d399' },
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
        <p className="text-sm text-gray-400">Configure your AccessAI workspace</p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-3 h-fit"
        >
          {sections.map((s, i) => {
            const c = colorMap[s.color]
            const active = activeSection === s.id
            return (
              <motion.button
                key={s.id}
                whileHover={{ x: 4 }}
                onClick={() => setActiveSection(s.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1"
                style={{
                  background: active ? c.bg : 'transparent',
                  border: active ? `1px solid ${c.border}` : '1px solid transparent',
                }}
              >
                <s.icon size={16} style={{ color: active ? c.text : '#6b7280' }} />
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-400'}`}>{s.title}</div>
                </div>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-3 glass-card p-6 space-y-6"
        >
          {activeSection === 'api' && (
            <>
              <div>
                <h3 className="font-bold text-white mb-4">AI Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-medium">Groq API Key</label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={settings.groqApiKey}
                        onChange={e => setSettings(s => ({ ...s, groqApiKey: e.target.value }))}
                        className="glass-input pr-10 font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Get your API key from <a href="https://console.groq.com" target="_blank" className="text-indigo-400 hover:underline">console.groq.com</a></p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-medium">AI Model</label>
                    <select
                      className="glass-input text-sm"
                      defaultValue="llama-3.1-70b-versatile"
                    >
                      <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile (Recommended)</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Faster)</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="glass-divider" />
              <div>
                <h3 className="font-bold text-white mb-4">Database</h3>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block font-medium">PostgreSQL Connection</label>
                  <input
                    type="text"
                    defaultValue="postgresql://localhost:5432/accessai"
                    className="glass-input font-mono text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {activeSection === 'scan' && (
            <div className="space-y-5">
              <h3 className="font-bold text-white mb-4">Scan Configuration</h3>
              {[
                { label: 'WCAG Compliance Level', key: 'wcagLevel', type: 'select', options: ['A', 'AA', 'AAA'] },
                { label: 'Maximum Pages to Crawl', key: 'maxPages', type: 'number', min: 1, max: 100 },
                { label: 'Scan Timeout (seconds)', key: 'timeout', type: 'number', min: 10, max: 300 },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm text-gray-400 mb-2 block font-medium">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={settings[field.key]}
                      onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                      className="glass-input text-sm"
                    >
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={settings[field.key]}
                      onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                      min={field.min}
                      max={field.max}
                      className="glass-input text-sm"
                    />
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div className="text-sm font-medium text-white">Include passed checks in report</div>
                  <div className="text-xs text-gray-500 mt-0.5">Show passing rules alongside violations</div>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, includePassedChecks: !s.includePassedChecks }))}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200"
                  style={{ background: settings.includePassedChecks ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                    animate={{ left: settings.includePassedChecks ? '24px' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-5">
              <h3 className="font-bold text-white mb-4">Notifications</h3>
              {[
                { key: 'emailNotifications', label: 'Email on scan complete', desc: 'Receive an email when each audit finishes' },
                { key: 'autoReport', label: 'Auto-generate PDF report', desc: 'Automatically create and attach a PDF report' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key] }))}
                    className="relative w-11 h-6 rounded-full transition-colors"
                    style={{ background: settings[item.key] ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                      animate={{ left: settings[item.key] ? '24px' : '4px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
              <div>
                <label className="text-sm text-gray-400 mb-2 block font-medium">Webhook URL (optional)</label>
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={e => setSettings(s => ({ ...s, webhookUrl: e.target.value }))}
                  placeholder="https://your-app.com/webhooks/accessai"
                  className="glass-input text-sm"
                />
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-5">
              <h3 className="font-bold text-white mb-4">Security Settings</h3>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
                  <CheckCircle size={15} />
                  API Key Encrypted
                </div>
                <p className="text-xs text-gray-400">Your API keys are encrypted at rest using AES-256.</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block font-medium">Allowed Origins (CORS)</label>
                <input type="text" defaultValue="localhost:5173, your-domain.com" className="glass-input text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block font-medium">Data Retention</label>
                <select className="glass-input text-sm" defaultValue="90">
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                  <option value="0">Forever</option>
                </select>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="btn-neon"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
