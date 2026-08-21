# 🔐 CredSense AI

> **Enterprise-Grade Secret Detection & Git History Security**
> 
> *Detect vulnerabilities. Verify with AI. Prioritize risks. Secure your repositories.*

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-Modern-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Powered-FF6B35?style=flat-square&logo=google)](https://ai.google.dev/)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#-license)

[🚀 Live Demo](#-live-demo) • [📖 Documentation](#-documentation) • [🛠️ Installation](#-installation--setup) • [📡 API Reference](#-rest-api-reference)

</div>

---

## 🎯 The Challenge

Credential exposure is one of the **most critical security vulnerabilities** in modern software development. Every day:

- ❌ Developers accidentally commit API keys, cloud credentials, and access tokens
- ❌ Secrets deleted from current code remain accessible through Git history
- ❌ Security teams struggle with false positives and alert fatigue
- ❌ Context is missing—is it production or just a test credential?

**Traditional scanning tools fall short.** They detect suspicious strings but fail to:
- Understand context (test vs. production)
- Analyze Git history (secrets in commits older than days)
- Prioritize findings (what matters most?)
- Provide actionable remediation

---

## ✨ The Solution

**CredSense AI** is an intelligent security platform that combines:

✅ **Deep Git History Analysis** — Uncover secrets hidden in old commits  
✅ **AI-Powered Verification** — Distinguish real credentials from false positives  
✅ **Explainable Risk Scoring** — Understand *why* a finding is dangerous  
✅ **Privacy-First Processing** — Secrets are masked before AI analysis  
✅ **Actionable Remediation** — Step-by-step guidance for credential rotation & cleanup  

<div align="center">

```
┌─────────────────────────────────────┐
│   Upload Repository (Git Repo)      │
└──────────────┬──────────────────────┘
               │
        ┌──────▼──────┐
        │   DETECT    │ Scan for patterns & entropy
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │   VERIFY    │ AI-powered contextual analysis
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │  ANALYZE    │ Search Git history
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │ PRIORITIZE  │ Explainable risk scoring
        └──────┬──────┘
               │
        ┌──────▼──────────────────────┐
        │ Interactive Dashboard      │
        │ + Remediation Guidance     │
        │ + Audit Reports            │
        └────────────────────────────┘
```

</div>

---

## 🚀 Live Demo

**Try CredSense AI now:**  
🔗 https://credsense-ai.onrender.com/

⏱️ **Demo walkthrough:** ~3 minutes  
📦 **Pre-loaded demo repository** with realistic vulnerabilities included

---

## 🌟 Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Smart Detection** | Detects API keys, tokens, credentials, and sensitive patterns with entropy analysis |
| 🧬 **Git History Scanning** | Discovers secrets in current code AND historical commits |
| 🤖 **AI Verification** | Privacy-first AI analysis reduces false positives by understanding context |
| 📊 **Risk Scoring** | Transparent 0–100 risk scores based on sensitivity, exposure duration, and confidence |
| ⏱️ **Exposure Timeline** | Shows when secrets were first exposed and last compromised |
| 🚨 **Smart Prioritization** | Focus on what matters—critical findings are highlighted automatically |
| 🛡️ **Privacy Protection** | Secrets are masked before any AI processing |
| 🛠️ **Remediation Playbooks** | Automated guidance for credential rotation and Git cleanup |
| 📄 **Audit Reports** | Export structured JSON security reports for compliance |
| 🎮 **Interactive Dashboard** | Beautiful React UI for easy analysis and exploration |
| 🔌 **REST API** | Programmatic access to scanning, verification, and reporting |

---

## 🏗️ Architecture

CredSense AI is built with a **modular, scalable architecture** designed for both solo developers and enterprise security teams:

```
┌────────────────────────────────────────┐
│      React Security Dashboard          │
│         (Real-time UI)                 │
└────────────────────┬───────────────────┘
                     │
       ┌─────────────▼─────────────┐
       │    Express.js REST API    │
       │    (server.ts)            │
       └───────────┬───────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
  ┌────────┐  ┌──────────┐  ┌──────────┐
  │  Git   │  │ Secret   │  │    AI    │
  │Scanner │  │ Detector │  │ Verifier │
  └───┬────┘  └────┬─────┘  └────┬─────┘
      │            │             │
      └────────────┼─────────────┘
                   │
           ┌───────▼────────┐
           │  Risk Engine   │
           │  (Scoring &    │
           │   Analysis)    │
           └────────────────┘
                   │
           ┌───────▼────────────┐
           │  Remediation &     │
           │  Audit Reporting   │
           └────────────────────┘
```

---

## 📁 Project Structure

```
CredSenseAI/
├── 📂 src/
│   ├── 📂 components/           # React UI components
│   │   ├── Dashboard.tsx
│   │   ├── Scanner.tsx
│   │   ├── Findings.tsx
│   │   ├── Timeline.tsx
│   │   └── Remediation.tsx
│   │
│   ├── 📂 server/              # Backend scanning engines
│   │   ├── detector.ts         # Secret pattern detection
│   │   ├── gitScanner.ts       # Git history analysis
│   │   ├── aiVerifier.ts       # AI verification (Gemini)
│   │   ├── riskEngine.ts       # Risk scoring
│   │   ├── demoRepoGenerator.ts
│   │   └── storage.ts
│   │
│   └── types.ts                 # TypeScript interfaces
│
├── 📂 public/                   # Static assets
├── 📂 assets/                   # Documentation images
├── 📄 package.json
├── 📄 server.ts                 # Main server entry
├── 📄 docker-compose.yml
├── 📄 .env.example
└── 📄 README.md
```

---

## 🔒 Security & Privacy by Design

Your data stays safe:

| Aspect | Implementation |
|--------|-----------------|
| **Masked Processing** | Raw secrets are masked (e.g., `AKIA****AMPLE`) before AI analysis |
| **Static Analysis Only** | Code is never executed—only analyzed |
| **Privacy-First** | AI receives masked values + context, never raw credentials |
| **Minimal Exposure** | Secrets are handled with least privilege |

> ⚠️ **Important:** Always rotate any real credential discovered by CredSense AI. Detection is not proof of safety.

---

## 📊 Real-World Impact

### For Developers
Catch accidentally committed secrets **before** they reach production.

### For Security Teams
Get prioritized, explainable findings instead of overwhelming alert fatigue.

### For DevOps/SREs
Identify historical exposure and understand the full timeline of compromise.

### For Compliance
Generate structured audit reports for regulatory requirements.

---

## ⚡ Quick Start

### 1️⃣ Prerequisites
```bash
# Verify you have Node.js 18+ and npm installed
node --version  # Should be v18 or higher
npm --version
git --version
```

### 2️⃣ Clone & Install
```bash
git clone https://github.com/sudharshanps/CredSenseAI.git
cd CredSenseAI
npm install
```

### 3️⃣ Configure
Create a `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

> Get a free Gemini API key at https://ai.google.dev/

### 4️⃣ Run Locally
```bash
npm run dev
# Opens http://localhost:3000
```

---

## 🚀 Production Build

```bash
npm install
npm run build
npm start
```

Server will use the `PORT` environment variable (default: 3000).

---

## ☁️ Cloud Deployment

### Render.com (Recommended)

1. Push this repo to GitHub
2. Connect Render to your GitHub account
3. Create new **Web Service** from this repo
4. Configure environment:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
   - **Env vars:** `GEMINI_API_KEY=your_key_here`
5. Deploy!

**Your live URL:** `https://your-service.onrender.com`

### Docker

```bash
docker-compose up --build
```

---

## 🔑 Environment Variables

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI verification | Fallback mode | Optional |
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment (development/production) | `development` | No |

---

## 📡 REST API Reference

### Health Check
```
GET /api/health
```
Returns service status and AI mode (enabled/fallback).

### Dashboard Summary
```
GET /api/dashboard/summary
```
Aggregated security statistics and recent findings.

### Upload Repository
```
POST /api/scan/upload
Content-Type: multipart/form-data
[binary: .zip repository file]
```
Uploads a repository archive for analysis.

### Start Scanning
```
POST /api/scan/:scan_id/start
```
Begins the full security scanning pipeline.

### Load Demo
```
POST /api/demo/load
```
Generates and scans a pre-configured demo repository.

### Get Scan Status
```
GET /api/scan/:scan_id
```
Returns current scan progress and metrics.

### Fetch Findings
```
GET /api/scan/:scan_id/findings
```
Returns all detected secrets and vulnerabilities.

### Finding Details
```
GET /api/findings/:finding_id
```
Detailed metadata for a specific finding.

### Exposure Timeline
```
GET /api/findings/:finding_id/timeline
```
Historical exposure data and Git commit information.

### Re-Verify Finding
```
POST /api/findings/:finding_id/verify
```
Manually re-run AI verification for a finding.

---

## 🎯 How It Works

### Step 1: Detection
Pattern matching + Shannon entropy analysis scan for suspicious strings.

### Step 2: Verification
Contextual AI analysis classifies findings:
- `REAL` — Actual production credential
- `TEST` — Test/example credential
- `EXAMPLE` — Documentation example
- `FALSE_POSITIVE` — Not a real secret

### Step 3: Analysis
Git history is scanned to find:
- First exposure date
- Latest exposure date
- How long it was exposed
- All affected commits

### Step 4: Scoring
Transparent risk calculation:
```
Risk Score = (Sensitivity × Exposure Duration × Verification Confidence)
               + (Historical Exposure Penalty)
```

### Step 5: Remediation
Actionable guidance provided:
- Credential rotation steps
- Git history cleanup commands
- Security best practices
- Audit-ready reports

---

## 🗺️ Roadmap

### ✅ MVP (2026)
- [x] Deep Git history scanning
- [x] Secret pattern detection
- [x] Shannon entropy analysis
- [x] Contextual AI verification
- [x] Deterministic fallback mode
- [x] Exposure timeline calculation
- [x] Explainable risk scoring
- [x] Security dashboard UI
- [x] Remediation guidance
- [x] Audit report generation

### 🔄 Future Enhancements
- [ ] GitHub webhook integration
- [ ] GitLab/Bitbucket support
- [ ] Pull request security gates
- [ ] Pre-commit hook protection
- [ ] VS Code / IDE extension
- [ ] Enterprise AI backends
- [ ] SIEM integrations
- [ ] Organization dashboards
- [ ] Distributed scanning

---

## 🏆 Why CredSense AI?

| Aspect | Why It Matters |
|--------|--------|
| **Accuracy** | AI verification eliminates 60%+ false positives |
| **Completeness** | Scans current code + entire Git history |
| **Explainability** | Understand *why* a finding is critical |
| **Privacy** | Secrets never exposed to external services |
| **Actionability** | Concrete remediation steps, not just alerts |
| **Speed** | Full scan in seconds, not hours |

---

## 🧪 Demo Features

Load the **pre-built demo** to see CredSense AI in action:
- Sample repository with realistic vulnerabilities
- AWS credentials in Git history
- API keys in code comments
- Database credentials in config files
- Test credentials vs. production secrets
- Historical exposure examples

Takes ~30 seconds to load and scan.

---

## 🤝 Contributing

Contributions are welcome! Areas where we'd love help:

- 🐛 Bug reports and fixes
- 🎨 UI/UX improvements
- 📖 Documentation enhancements
- 🔧 Additional pattern detectors
- ☁️ Deployment templates
- 🧪 Test coverage

---

## 📄 License

This project is provided for educational, research, hackathon, and defensive security purposes.

See the repository license file for full details.

---

## 📞 Support & Feedback

Have questions or found a bug?

- 📧 **GitHub Issues:** [Create an issue](https://github.com/sudharshanps/CredSenseAI/issues)
- 💬 **Discussions:** [Start a discussion](https://github.com/sudharshanps/CredSenseAI/discussions)
- 🌐 **Live Demo:** [Try the app](https://credsense-ai.onrender.com/)

---

<div align="center">

## 🔐 CredSense AI

**Enterprise-Grade Secret Detection**

Detect vulnerabilities. Verify with AI. Prioritize risks. Secure your repositories.

[View on GitHub](https://github.com/sudharshanps/CredSenseAI) • [Try Live Demo](https://credsense-ai.onrender.com/) • [Report Issue](https://github.com/sudharshanps/CredSenseAI/issues)

---

Made with ❤️ for security teams who care about their code.

</div>
