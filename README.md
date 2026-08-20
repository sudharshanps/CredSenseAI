# CredSense AI

> **Detect. Verify. Prioritize. Secure.**  
> *AI-Powered Secret Detection & Git History Security Platform*

---

## 🎯 Problem Statement
Developers frequently commit API keys, cloud credentials, tokens, and private keys into Git repositories.
1. **Shallow Remediation**: Simply deleting a secret from the latest commit does *not* remove it from Git history; it remains retrievable by clone or commit crawler.
2. **Alert Fatigue**: Traditional scanners flood security teams with false positives and test fixtures, obscuring active production vulnerabilities.
3. **Missing Context**: Static regular expressions lack contextual understanding of whether a token is an authentic production key, an example template, or a mock test token.

---

## 🚀 The CredSense AI Solution
CredSense AI implements a 5-stage defensive security pipeline:
```
Detect → Verify → Investigate → Prioritize → Remediate
```

- **Deep Git History Crawl**: Analyzes working tree files and walks the full commit graph to detect first exposure, latest exposure, and dormant historical secrets.
- **Privacy-First AI Verification**: Masks secrets in memory, extracts surrounding code context, and uses **Google Gemini 3.7 Flash** (with a deterministic local fallback) to classify findings as `REAL`, `TEST`, `EXAMPLE`, or `FALSE_POSITIVE`.
- **Explainable Multi-Factor Risk Scoring**: Calculates a transparent 0–100 score based on secret sensitivity, exposure duration, presence in active HEAD vs history, and AI verification confidence.
- **Actionable Remediation Playbooks**: Provides prescriptive playbooks, credential rotation guides, and automated `git-filter-repo` / `BFG` history purge commands.

---

## 🏗️ Architecture

```
credsense-ai/
├── src/
│   ├── components/            # React UI (Dashboard, Scanner, Findings, Timeline, Remediation)
│   ├── server/                # Core Scanner & Analysis Engines
│   │   ├── detector.ts        # Regex patterns, Shannon Entropy calculator & masking
│   │   ├── gitScanner.ts      # Git DAG crawler, blame & exposure lifespan calculator
│   │   ├── aiVerifier.ts      # Gemini 3.7 Flash & deterministic local fallback
│   │   ├── riskEngine.ts      # Multi-factor explainable risk algorithm
│   │   ├── demoRepoGenerator.ts # Realistic on-demand Git repository with commits
│   │   └── storage.ts         # In-memory & SQLite cache
│   └── types.ts               # Shared TypeScript schemas
├── backend/                   # Python FastAPI alternative architecture & test suite
│   ├── app/                   # FastAPI routes, schemas & entropy modules
│   ├── tests/                 # Pytest test suite
│   └── requirements.txt
├── server.ts                  # Full-stack Express API gateway & Vite server
├── docker-compose.yml
└── README.md
```

---

## 🔒 Privacy & Security Model
- **Zero Plaintext Storage**: Raw secret strings are masked (`AKIA**************AMPLE`) before storage.
- **Masked-Only AI Ingestion**: The Gemini AI API only receives masked variables and code syntax to classify context—never raw credentials.
- **Non-Execution Guarantee**: Uploaded repositories are statically analyzed in ephemeral sandboxes and are never executed.
- **Zero Telemetry**: No analytics, telemetry, or external transmissions.

---

## ⚡ Quick Demo Walkthrough (< 3 Minutes)
1. Launch the application.
2. Click **"Load Demo Repository"** in the top navigation bar.
3. Observe the automated 6-stage pipeline:
   - Git repository detection
   - Source code scan
   - Historical commit traversal
   - Entropy evaluation
   - AI / Local contextual verification
   - Risk scoring & remediation generation
4. Click on the **CRITICAL** finding (e.g. AWS Key or GitHub Token) to view the **Surrounding Context**, **Explainable Risk Breakdown**, and **Exposure Timeline**.
5. Switch to the **Exposure Timeline** tab to verify that removed secrets are still highlighted as historical vulnerabilities.
6. Open the **Remediation** tab to copy `git-filter-repo` commands and export the JSON audit report.

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ / 20+
- Git CLI

### 1. Local Execution
```bash
# Clone the repository
git clone https://github.com/example/credsense-ai.git
cd credsense-ai

# Install dependencies
npm install

# Start the dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Docker Execution
```bash
docker-compose up --build
```

---

## 🔑 Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional Google Gemini API Key for AI verification | *(Local fallback used if unset)* |
| `PORT` | Application server port | `3000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, engine info, and AI mode |
| `GET` | `/api/dashboard/summary` | Aggregated statistics, risk metrics, and recent findings |
| `POST` | `/api/scan/upload` | Upload a repository ZIP archive |
| `POST` | `/api/scan/:scan_id/start` | Execute full source & Git history security scan |
| `POST` | `/api/demo/load` | Generate on-demand Git demo repo and run scan |
| `GET` | `/api/scan/:scan_id` | Retrieve scan status and stage metrics |
| `GET` | `/api/scan/:scan_id/findings` | Retrieve all detected findings for a scan |
| `GET` | `/api/findings/:finding_id` | Retrieve single finding deep metadata |
| `GET` | `/api/findings/:finding_id/timeline`| Retrieve commit exposure history for a finding |
| `POST` | `/api/findings/:finding_id/verify` | Re-verify finding on-demand with AI / local engine |

---

## 🗺️ Roadmap
- [x] **2026 MVP**: Deep Git history scanner, Shannon entropy engine, Gemini 3.7 Flash & deterministic local fallback, exposure duration calculator, explainable risk scoring, dark security dashboard.
- [ ] **Future**: GitHub / GitLab Webhook integrations & PR gatekeeper.
- [ ] **Future**: IDE extension with real-time pre-commit masking.
- [ ] **Future**: Enterprise self-hosted LLM backends & SIEM integrations (Splunk / Datadog).
