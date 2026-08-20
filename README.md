# 🔐 CredSense AI

> **Detect. Verify. Prioritize. Secure.**
> **AI-Powered Secret Detection & Git History Security Platform**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-Node.js-black?logo=express)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI-orange)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](#-license)

---

## 🌐 Live Demo

🚀 **Production Demo:** https://credsense-ai.onrender.com/

📦 **Source Code:**
https://github.com/sudharshanps/CredSenseAI

> Replace `YOUR_RENDER_URL` with the public Render URL after the deployment becomes **Live**.

---

## 🎯 Problem Statement

Developers frequently commit API keys, cloud credentials, access tokens, private keys, and other sensitive information into Git repositories.

Traditional secret-scanning approaches often identify suspicious strings but fail to provide enough context to determine whether a finding is actually dangerous.

CredSense AI addresses three major problems:

### 1. Shallow Remediation

Deleting a secret from the latest commit does **not** remove it from Git history. Previously committed credentials can remain accessible through historical commits, clones, mirrors, or commit crawlers.

### 2. Alert Fatigue

Traditional scanners can generate large numbers of findings, including test credentials, examples, documentation snippets, and false positives. This makes it difficult for security teams to focus on genuinely dangerous secrets.

### 3. Missing Context

Pattern matching alone cannot always determine whether a detected token is:

* A real production credential
* A test token
* An example value
* A mock credential
* A false positive

CredSense AI adds contextual analysis and explainable risk scoring to improve the quality and prioritization of security findings.

---

# 🚀 The CredSense AI Solution

CredSense AI implements a defensive security-analysis pipeline:

```text
Detect
   ↓
Verify
   ↓
Investigate
   ↓
Prioritize
   ↓
Remediate
```

### 🔎 Deep Git History Analysis

CredSense AI analyzes repository files and Git history to identify:

* Current secrets
* Historical secrets
* First exposure
* Latest exposure
* Exposure duration
* Secrets removed from the latest commit but still present in history

### 🤖 Privacy-First AI Verification

Detected secrets are masked before contextual AI analysis.

The AI-assisted verification layer evaluates surrounding code context and classifies findings into categories such as:

```text
REAL
TEST
EXAMPLE
FALSE_POSITIVE
```

A deterministic local fallback is available when AI verification is unavailable.

### 📊 Explainable Risk Scoring

Each finding receives a transparent risk score based on multiple factors, including:

* Secret sensitivity
* Exposure duration
* Current vs historical exposure
* Verification confidence
* Repository context

The result is an explainable **0–100 risk score** instead of an unexplained severity label.

### 🛠️ Actionable Remediation

CredSense AI provides remediation guidance including:

* Credential rotation recommendations
* Secret removal guidance
* Git history cleanup
* `git-filter-repo` commands
* BFG Repo-Cleaner guidance
* JSON security audit reports

---

# ✨ Key Features

| Feature                      | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| 🔍 Secret Detection          | Detects API keys, tokens, credentials and sensitive patterns |
| 🧬 Git History Analysis      | Searches historical commits for previously exposed secrets   |
| 🧠 AI Verification           | Uses contextual AI analysis to reduce false positives        |
| 📈 Risk Scoring              | Provides explainable 0–100 security risk scores              |
| ⏱️ Exposure Timeline         | Shows when a secret was first and last exposed               |
| 🚨 Severity Prioritization   | Helps security teams focus on critical findings              |
| 🛡️ Privacy-First Processing | Masks sensitive values before AI analysis                    |
| 🛠️ Remediation Playbooks    | Provides actionable recovery instructions                    |
| 📄 Audit Reports             | Supports structured security reporting                       |
| 🎮 Demo Repository           | Generates a realistic repository for demonstrations          |
| 🔌 REST API                  | Exposes scanning and security-analysis capabilities          |

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      React UI        │
                         │ Security Dashboard   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Express API        │
                         │   server.ts          │
                         └──────────┬───────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
        │ Git Scanner  │    │ Secret       │    │ AI Verifier  │
        │              │    │ Detector     │    │              │
        └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
               │                   │                   │
               └───────────────────┼───────────────────┘
                                   ▼
                         ┌──────────────────────┐
                         │    Risk Engine       │
                         │ Explainable Scoring  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Remediation Engine   │
                         │ & Audit Reporting    │
                         └──────────────────────┘
```

---

# 📁 Project Structure

```text
CredSenseAI/
│
├── src/
│   ├── components/
│   │   ├── Dashboard
│   │   ├── Scanner
│   │   ├── Findings
│   │   ├── Timeline
│   │   └── Remediation
│   │
│   ├── server/
│   │   ├── detector.ts
│   │   ├── gitScanner.ts
│   │   ├── aiVerifier.ts
│   │   ├── riskEngine.ts
│   │   ├── demoRepoGenerator.ts
│   │   └── storage.ts
│   │
│   └── types.ts
│
├── backend/
│   ├── app/
│   ├── tests/
│   └── requirements.txt
│
├── public/
├── assets/
├── server.ts
├── index.html
├── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 🔒 Privacy & Security Model

Security and privacy are core design principles of CredSense AI.

### 🔐 Masked Secret Processing

Raw secret values are masked before being stored or passed into contextual verification.

Example:

```text
AKIAIOSFODNN7EXAMPLE
        ↓
AKIA**************AMPLE
```

### 🤖 Masked AI Context

The AI verification layer is designed to receive masked values and relevant code context rather than raw credentials.

### 🚫 Repository Execution Protection

Uploaded repositories are analyzed statically. Repository code is not intentionally executed as part of the scanning workflow.

### 🧹 Minimal Data Exposure

The application is designed to minimize unnecessary transmission of sensitive information during analysis.

> **Important:** Users should still rotate any real credential discovered by the scanner. Secret detection should be treated as a security response workflow, not as proof that a credential is safe.

---

# 🌍 Real-World Impact

Credential exposure is a common source of security incidents in modern software development.

CredSense AI helps development and security teams identify and prioritize these risks earlier in the software lifecycle.

### Developer Security

Helps developers discover accidentally committed credentials before they become production incidents.

### Security Operations

Provides prioritized and explainable findings instead of presenting security teams with an unstructured list of suspicious strings.

### Historical Exposure Detection

Identifies secrets that have been removed from current code but remain accessible through Git history.

### Faster Remediation

Provides practical remediation guidance for credential rotation and Git history cleanup.

### CI/CD Potential

The platform can be extended into automated security gates that prevent sensitive credentials from reaching protected branches or production deployments.

---

# 📈 Scalability

CredSense AI is designed using modular components so individual security engines can evolve independently.

### Current Architecture

* Modular detection engine
* Git history scanning engine
* Contextual AI verification
* Explainable risk engine
* REST API architecture
* React-based security dashboard
* Structured audit reporting

### Future Scalability

The architecture can be extended with:

* GitHub/GitLab webhook integrations
* Pull-request security gates
* Background job queues
* Distributed repository scanning
* Persistent database storage
* Enterprise SIEM integrations
* Organization-level security dashboards
* Horizontal API scaling
* IDE integrations

---

# ⚡ Quick Demo Walkthrough

The application can be demonstrated in under three minutes.

### Step 1 — Launch CredSense AI

Open the application and access the security dashboard.

### Step 2 — Load Demo Repository

Click:

```text
Load Demo Repository
```

### Step 3 — Run the Security Pipeline

The application performs:

```text
Repository Detection
        ↓
Source Code Scan
        ↓
Git History Traversal
        ↓
Entropy Evaluation
        ↓
Contextual Verification
        ↓
Risk Scoring
        ↓
Remediation Generation
```

### Step 4 — Inspect Critical Findings

Open a critical finding to view:

* Secret type
* Detection source
* Surrounding context
* Risk score
* Verification result
* Exposure information

### Step 5 — View Exposure Timeline

The timeline shows historical exposure and demonstrates why simply deleting a secret from the latest commit may not be sufficient.

### Step 6 — Remediate

Open the remediation section to access:

* Credential rotation guidance
* Git history cleanup commands
* Security recommendations
* JSON audit report

---

# 🛠️ Installation & Setup

## Prerequisites

Install:

* Node.js 18+
* Git
* npm

Verify:

```bash
node --version
npm --version
git --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/sudharshanps/CredSenseAI.git
cd CredSenseAI
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a local `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
NODE_ENV=development
```

> Never commit `.env` or API keys to GitHub.

---

## 4. Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🚀 Production Build

Build the application:

```bash
npm install
npm run build
```

Start the production server:

```bash
npm start
```

The production server uses the deployment platform's `PORT` environment variable when available.

---

# ☁️ Production Deployment

CredSense AI can be deployed as a full-stack Node.js web service.

### Current Deployment

**Platform:** Render

**Runtime:** Node.js

**Branch:**

```text
main
```

**Build Command:**

```bash
npm install && npm run build
```

**Start Command:**

```bash
npm start
```

### Environment Variable

```text
GEMINI_API_KEY=your_gemini_api_key
```

### Live Application

```text
YOUR_RENDER_URL
```

> Replace `YOUR_RENDER_URL` with the actual public Render URL after deployment.

---

# 🐳 Docker

The repository includes Docker Compose configuration.

```bash
docker-compose up --build
```

For production deployment, the Node.js build/start workflow can be used directly on supported hosting platforms.

---

# 🔑 Environment Variables

| Variable         | Description                                        | Default        |
| ---------------- | -------------------------------------------------- | -------------- |
| `GEMINI_API_KEY` | Optional Google Gemini API key for AI verification | Local fallback |
| `PORT`           | Application server port                            | `3000`         |
| `NODE_ENV`       | Application environment                            | `development`  |

---

# 📡 REST API Reference

## Health

### `GET /api/health`

Returns service health information and AI mode.

---

## Dashboard

### `GET /api/dashboard/summary`

Returns aggregated security statistics, risk metrics, and recent findings.

---

## Repository Upload

### `POST /api/scan/upload`

Uploads a repository ZIP archive for analysis.

---

## Start Scan

### `POST /api/scan/:scan_id/start`

Starts the full source and Git history security scan.

---

## Demo Repository

### `POST /api/demo/load`

Generates a demonstration Git repository and executes the scanning pipeline.

---

## Scan Status

### `GET /api/scan/:scan_id`

Returns scan status and stage metrics.

---

## Scan Findings

### `GET /api/scan/:scan_id/findings`

Returns detected findings for a scan.

---

## Finding Details

### `GET /api/findings/:finding_id`

Returns detailed metadata for an individual finding.

---

## Exposure Timeline

### `GET /api/findings/:finding_id/timeline`

Returns historical exposure information for a finding.

---

## Re-Verification

### `POST /api/findings/:finding_id/verify`

Re-verifies a finding using the AI/local verification engine.

---

# 📸 Screenshots

Add screenshots of the deployed application here.

### Security Dashboard

```text
assets/dashboard.png
```

### Secret Detection

```text
assets/findings.png
```

### Exposure Timeline

```text
assets/timeline.png
```

### Remediation

```text
assets/remediation.png
```

Example Markdown:

```markdown
![CredSense AI Dashboard](assets/dashboard.png)

![Secret Detection](assets/findings.png)

![Exposure Timeline](assets/timeline.png)

![Remediation](assets/remediation.png)
```

---

# 🧪 Security Analysis Pipeline

CredSense AI combines multiple analysis techniques:

```text
Pattern Detection
       +
Entropy Analysis
       +
Git History Analysis
       +
Contextual Verification
       +
Risk Scoring
       =
Prioritized Security Findings
```

This layered approach helps distinguish potentially dangerous credentials from examples, tests, and other low-risk matches.

---

# 🗺️ Roadmap

### ✅ 2026 MVP

* [x] Deep Git history scanning
* [x] Secret pattern detection
* [x] Shannon entropy analysis
* [x] Contextual AI verification
* [x] Deterministic local fallback
* [x] Exposure duration calculation
* [x] Explainable risk scoring
* [x] Security dashboard
* [x] Exposure timeline
* [x] Remediation guidance
* [x] Audit reporting

### 🔄 Future

* [ ] GitHub webhook integration
* [ ] GitLab integration
* [ ] Pull Request security gatekeeper
* [ ] Real-time pre-commit protection
* [ ] IDE extension
* [ ] Enterprise self-hosted AI backends
* [ ] SIEM integrations
* [ ] Organization-level dashboards
* [ ] Distributed repository scanning

---

# 🏆 Hackathon / Production Evaluation Highlights

CredSense AI focuses on the evaluation areas required for a production-level security project:

| Evaluation Area       | CredSense AI Approach                                   |
| --------------------- | ------------------------------------------------------- |
| **Implementation**    | Full-stack React + Node.js security platform            |
| **Innovation**        | AI-assisted contextual secret verification              |
| **Usability**         | Interactive security dashboard and remediation guidance |
| **Scalability**       | Modular scanning and API architecture                   |
| **Performance**       | Multi-stage scanning pipeline with focused analysis     |
| **Security**          | Secret masking and static repository analysis           |
| **Real-World Impact** | Detection of current and historical credential exposure |

---

# 📄 License

This project is intended for educational, research, hackathon, and defensive security purposes.

See the repository license for applicable usage terms.

---

# 👨‍💻 Project

**CredSense AI**

> **Detect. Verify. Prioritize. Secure.**

**GitHub:**
https://github.com/sudharshanps/CredSenseAI

**Live Demo:**
`YOUR_RENDER_URL`
