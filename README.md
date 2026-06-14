# AccessAI — AI-Powered Accessibility Audit Agent

<div align="center">
  <img src="https://img.shields.io/badge/WCAG_2.1-AA_Compliant-6366f1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-Groq_LLaMA_3.1-8b5cf6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker" />
</div>

---

A **production-grade**, **portfolio-quality** AI application that scans websites for WCAG accessibility violations, uses Groq AI to generate intelligent explanations and code fixes, and produces professional downloadable reports — all inside a stunning glassmorphism dashboard.

## ✨ Screenshots

| Landing Page | Dashboard | Audit Results |
|---|---|---|
| Premium hero with animated mesh | 6-metric stat grid + area charts | Score ring + radar + issue accordions |

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and configure
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Build and start all services
docker compose up --build

# App runs at:
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000/api/docs
```

### Option 2: PowerShell Setup Script (Windows)

```powershell
# One command installs everything and starts the app
.\setup.ps1

# Or individual services:
.\setup.ps1 -FrontendOnly   # Just the React app
.\setup.ps1 -BackendOnly    # Just the FastAPI backend
.\setup.ps1 -Docker         # Docker Compose mode
```

### Option 3: Manual Setup

```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173

# Backend (new terminal)
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload  # http://localhost:8000
```

## 🏗️ Architecture

```
accessibility-audit-agent/
├── frontend/                    # React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Premium hero + features + testimonials
│   │   │   ├── Dashboard.jsx        # Analytics with Recharts
│   │   │   ├── NewAudit.jsx         # URL input + live scan progress
│   │   │   ├── AuditHistory.jsx     # Searchable/filterable history
│   │   │   ├── AuditResults.jsx     # Score ring + radar + issue accordions
│   │   │   ├── Reports.jsx          # PDF/CSV generation with jsPDF
│   │   │   └── Settings.jsx         # API keys + scan configuration
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── GlassCard.jsx    # Animated glass cards + StatCard
│   │   │   │   ├── ScoreRing.jsx    # SVG animated ring with glow
│   │   │   │   ├── ProgressBar.jsx  # Gradient animated progress
│   │   │   │   └── MeshBackground.jsx  # Canvas particle animation
│   │   │   └── audit/
│   │   │       └── IssueCard.jsx    # Animated accordion with syntax highlight
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx  # Collapsible sidebar + animated nav
│   │   └── lib/
│   │       ├── api.js               # Axios client for FastAPI
│   │       └── mockData.js          # Demo data (6 real WCAG issues)
│   ├── tailwind.config.js           # Custom design tokens
│   └── index.css                    # Glassmorphism design system
│
├── backend/                     # Python FastAPI
│   ├── main.py                      # App entry + CORS + routing
│   ├── app/
│   │   ├── config.py                # Pydantic settings
│   │   ├── database.py              # Async SQLAlchemy
│   │   ├── models.py                # Audit, Issue, Report tables
│   │   ├── schemas.py               # Request/response validation
│   │   ├── routers/
│   │   │   ├── audit.py             # Start/status/results/cancel/history
│   │   │   ├── dashboard.py         # Stats + recent audits
│   │   │   ├── reports.py           # PDF/CSV generation + download
│   │   │   └── settings.py          # Runtime config management
│   │   └── services/
│   │       ├── scanner.py           # Playwright + axe-core (with mock fallback)
│   │       └── ai_analyzer.py       # Groq LLM analysis + templates
│   └── requirements.txt
│
├── docker-compose.yml           # Full stack: DB + Backend + Frontend
├── .env.example                 # Environment template
└── setup.ps1                    # One-click Windows setup script
```

## 🎨 Design System

The UI is built on a custom **glassmorphism design system**:

| Token | Value |
|---|---|
| Background | `#080812` (near-black) |
| Glass card | `rgba(255,255,255,0.04)` + `backdrop-filter: blur(24px)` |
| Gradient accent | `#6366f1` → `#8b5cf6` (indigo-purple) |
| Neon glow | `0 0 30px rgba(99,102,241,0.4)` |
| Font | Inter (UI) + JetBrains Mono (code) |

## 🔌 API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/audit/start` | Start accessibility scan |
| `GET` | `/audit/{id}/status` | Poll scan progress |
| `GET` | `/audit/{id}/results` | Get full results + issues |
| `POST` | `/audit/{id}/cancel` | Cancel running scan |
| `GET` | `/audit/history` | Paginated audit history |
| `GET` | `/dashboard/stats` | Analytics overview |
| `POST` | `/reports/{id}/generate` | Generate PDF/CSV |
| `GET` | `/reports/{id}/download` | Download report file |
| `GET/PUT` | `/settings` | Read/update configuration |

Full interactive docs: **http://localhost:8000/api/docs**

## 🤖 AI Integration

### Groq LLM (llama-3.1-70b-versatile)
- Analyzes each WCAG violation in context
- Generates plain-English explanations for developers
- Produces specific code fixes (before/after examples)
- Creates executive summaries for stakeholders

**Fallback:** If Groq API key is not configured, intelligent template-based explanations are used so the app remains fully functional in demo mode.

### Axe-Core + Lighthouse
- Playwright headless Chrome crawls target URLs
- axe-core 4.9 injects into pages and detects WCAG violations
- Rules mapped to WCAG 2.1 A, AA, and AAA levels
- Multi-page crawling with configurable depth

## 📊 Features Overview

### Dashboard
- 6 animated stat cards with counter animations
- Recharts area chart (audit trends)
- SVG score ring with glow effect
- Category breakdown with progress bars
- Recent audits table with severity badges
- AI weekly insight banner

### New Audit
- URL validation + quick-select buttons
- WCAG level selector (A / AA / AAA)
- 5-step animated scan progress
- Real-time step progress bars
- Scan completion summary

### Audit Results
- Animated SVG score ring
- Category scores with colored progress bars
- Recharts radar chart for coverage
- Issue count cards (Critical/Serious/Moderate/Minor/Passed)
- AI Executive Summary (expandable)
- Filterable issue list with animated accordions
- Syntax-highlighted code fixes

### Reports
- PDF generation using jsPDF
- CSV export with all issue data
- Executive summary PDF
- Accessibility scorecard
- Download history

### Settings
- Groq API key configuration
- AI model selection
- WCAG compliance level
- Max pages & timeout
- Email notifications toggle
- Webhook configuration
- Data retention policy

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| PDF Generation | jsPDF + jsPDF-AutoTable |
| Code Highlighting | react-syntax-highlighter |
| Backend | Python FastAPI |
| Database | PostgreSQL + SQLAlchemy (async) |
| AI | Groq API (llama-3.1-70b) |
| Accessibility Engine | Playwright + axe-core 4.9 |
| Containerization | Docker + Docker Compose |

## 🔧 Environment Variables

```env
# Required for AI features
GROQ_API_KEY=gsk_your_key_here

# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/accessai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=accessai

# Optional
GROQ_MODEL=llama-3.1-70b-versatile
SECRET_KEY=your-secret-key
MAX_PAGES=10
WCAG_LEVEL=AA
```
---

👥 Team Information

🚀 Team Name

AccessAI Team

👨‍💻 Team Members

1. Shamkalla Mounish

Branch: Artificial Intelligence and Machine Learning

Responsibilities:

- Frontend Development (React)
- Backend Development (FastAPI)
- Accessibility Audit Integration
- System Testing & Debugging

---

2. Shaik Saniya Khateeja

Branch: Artificial Intelligence and Data Science

Responsibilities:

- AI Integration
- API Development Support
- Documentation Assistance
- Feature Validation & Testing

---

3. Karimunnisa Shaik

Branch: Computer Science and Engineering (CSE)

Responsibilities:

- Quality Assurance Testing
- Documentation Preparation
- Requirement Validation
- Demo & Project Verification

---

🤖 AI Usage Disclosure

AI Tools Utilized

- ChatGPT
- Gemini

How AI Assisted This Project

AI tools were used as development assistants for:

✅ Backend Debugging and Issue Resolution

✅ Frontend Development Support

✅ Accessibility Scanner Improvements

✅ API Integration Guidance

✅ Documentation Enhancement

✅ Error Analysis and Troubleshooting

Human Contribution

All final implementation, integration, testing, validation, and project decisions were performed by the team members.

---

📝 Prompt Documentation

Representative Prompts Used During Development

Backend Debugging

«Investigate FastAPI startup issues and identify the exact exception causing failure.»

Frontend Debugging

«Analyze Dashboard and Audit History loading issues and resolve React state management problems.»

Accessibility Scanner Debugging

«Investigate Playwright scan failures and identify the root cause preventing audit completion.»

AI Integration

«Optimize AI analysis workflow and improve asynchronous API handling.»

Documentation Support

«Generate project documentation, architecture explanations, and setup instructions.»

---

📌 AI Usage Note

The project demonstrates the practical use of AI-assisted software development.

AI was used to:

- Accelerate debugging
- Improve code quality
- Assist in documentation
- Provide development guidance

All generated suggestions were manually reviewed, validated, tested, and integrated by the development team.

🎯 Sample Usage

🌐 Input Website

https://example.com

📊 Audit Results

Metric| Result
Accessibility Score| ⭐ 87/100
Critical Issues| 🔴 2
Warnings| 🟡 5
Passed Checks| ✅ 45

🤖 AI-Generated Deliverables

✅ Detailed Accessibility Report

✅ Intelligent AI Recommendations

✅ WCAG Compliance Analysis

✅ Actionable Code Fix Suggestions

✅ Executive Summary for Stakeholders

---

⚠️ Assumptions & Limitations

Assumptions

- 🌐 Active internet connection is required.
- 🔑 AI-powered analysis requires a valid Groq API key.
- 📄 Target website must allow page crawling and accessibility scanning.

Limitations

- 🚫 Some websites may block automated scanners and crawlers.
- ⏳ Large or highly dynamic websites may require additional scan time.
- 🎭 JavaScript-heavy applications may produce varying results depending on page state.
- 📈 Accessibility findings are based on automated WCAG checks and should be complemented with manual review for maximum accuracy.

---

«💡 Note: AccessAI is designed to accelerate accessibility auditing and remediation, helping developers identify issues faster and improve overall WCAG compliance.»
---
## 📝 License

MIT License — Built for the accessible web. 🌐

---

<div align="center">
  Built with ❤️ · React · FastAPI · Groq · axe-core
</div>
