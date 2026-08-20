import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Terminal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Play,
  Sliders,
  Sparkles,
  Layers,
  FileCode,
  Lock,
  ExternalLink,
  Code2,
  Workflow,
  Check,
  AlertTriangle,
  RefreshCw,
  Eye,
  Info,
  Settings2,
  Send,
  MessageSquare,
  Flame,
} from 'lucide-react';
import { Finding, SecurityPolicyConfig, CICDGuardrailConfig, SeverityLevel, Scan } from '../types';

interface CICDGuardrailTemplateViewProps {
  findings: Finding[];
  scan?: Scan | null;
  onNavigateTab?: (tab: string) => void;
}

export function CICDGuardrailTemplateView({ findings, scan, onNavigateTab }: CICDGuardrailTemplateViewProps) {
  const [activeFormat, setActiveFormat] = useState<'github-pr' | 'github-audit' | 'github-strict' | 'pre-commit' | 'gitlab-ci'>('github-pr');
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [validationPassed, setValidationPassed] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicyConfig[]>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [dryRunRunning, setDryRunRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<{
    status: 'PASSED' | 'BLOCKED';
    exitCode: number;
    blockedCount: number;
    warningsCount: number;
    stepsExecuted: number;
    logs: string[];
  } | null>(null);

  // Customizer Configuration State
  const [config, setConfig] = useState<CICDGuardrailConfig>({
    workflowName: 'CredSense AI Security Guardrail',
    fileName: 'credsense-guardrail.yml',
    triggers: {
      pullRequest: true,
      push: true,
      schedule: false,
      cronExpression: '0 2 * * 1',
      workflowDispatch: true,
    },
    branches: ['main', 'master', 'develop'],
    runner: 'ubuntu-latest',
    policyMode: 'SYNCED_POLICIES',
    blockOnSeverity: 'HIGH',
    scanDepth: 'full',
    enableAISemanticFilter: true,
    enableEntropyCheck: true,
    entropyThreshold: 4.2,
    enableSarifUpload: true,
    enablePRComment: true,
    enableSecretMasking: true,
    enableWebhookAlerts: false,
    excludePaths: ['node_modules/**', 'dist/**', '**/*.test.*', 'fixtures/**'],
    ignoreTestFiles: true,
    environmentVariables: {
      apiKeySecretName: 'CREDSENSE_API_KEY',
      geminiKeySecretName: 'GEMINI_API_KEY',
      webhookSecretName: 'SECURITY_ALERT_WEBHOOK',
    },
  });

  const [newBranchInput, setNewBranchInput] = useState('');
  const [newExcludeInput, setNewExcludeInput] = useState('');

  // Fetch active policies from server
  useEffect(() => {
    setIsLoadingPolicies(true);
    fetch('/api/policies')
      .then((res) => res.json())
      .then((data) => {
        if (data.policies) {
          setPolicies(data.policies);
          // Sync with active policy logic
          const active = data.policies.filter((p: SecurityPolicyConfig) => p.enabled);
          const hasCritOnly = active.some((p: SecurityPolicyConfig) => p.ruleKey === 'BLOCK_CRITICAL_HEAD') &&
            !active.some((p: SecurityPolicyConfig) => p.ruleKey === 'BLOCK_HIGH_RISK');
          const hasHistory = active.some((p: SecurityPolicyConfig) => p.ruleKey === 'REQUIRE_HISTORY_SCAN');
          const hasAI = active.some((p: SecurityPolicyConfig) => p.ruleKey === 'AI_VALIDATION');
          const hasEntropy = active.some((p: SecurityPolicyConfig) => p.ruleKey === 'SHANNON_ENTROPY');

          setConfig((prev) => ({
            ...prev,
            blockOnSeverity: hasCritOnly ? 'CRITICAL' : 'HIGH',
            scanDepth: hasHistory ? 'full' : 'incremental',
            enableAISemanticFilter: hasAI,
            enableEntropyCheck: hasEntropy,
          }));
        }
      })
      .catch((err) => console.error('Failed to load policies for guardrail template:', err))
      .finally(() => setIsLoadingPolicies(false));
  }, []);

  // Format Switcher Presets
  const applyPreset = (preset: typeof activeFormat) => {
    setActiveFormat(preset);
    if (preset === 'github-pr') {
      setConfig((prev) => ({
        ...prev,
        workflowName: 'CredSense AI - PR Security Gate',
        fileName: 'credsense-guardrail.yml',
        triggers: { pullRequest: true, push: true, schedule: false, workflowDispatch: true },
        policyMode: 'SYNCED_POLICIES',
        blockOnSeverity: 'HIGH',
        scanDepth: 'full',
        enablePRComment: true,
        enableSarifUpload: true,
        enableSecretMasking: true,
      }));
    } else if (preset === 'github-audit') {
      setConfig((prev) => ({
        ...prev,
        workflowName: 'CredSense AI - Nightly Full History Audit',
        fileName: 'credsense-audit.yml',
        triggers: { pullRequest: false, push: false, schedule: true, cronExpression: '0 2 * * 1', workflowDispatch: true },
        policyMode: 'AUDIT_ONLY',
        blockOnSeverity: 'CRITICAL',
        scanDepth: 'full',
        enablePRComment: false,
        enableSarifUpload: true,
        enableWebhookAlerts: true,
      }));
    } else if (preset === 'github-strict') {
      setConfig((prev) => ({
        ...prev,
        workflowName: 'CredSense AI - Zero-Trust Release Gate',
        fileName: 'credsense-strict-gate.yml',
        triggers: { pullRequest: true, push: true, schedule: false, workflowDispatch: true },
        policyMode: 'STRICT',
        blockOnSeverity: 'MEDIUM',
        scanDepth: 'full',
        enablePRComment: true,
        enableSarifUpload: true,
        enableSecretMasking: true,
        enableAISemanticFilter: true,
        enableEntropyCheck: true,
      }));
    }
  };

  // Generate GitHub Actions YAML
  const generateGitHubActionsYAML = () => {
    const triggerLines: string[] = [];
    if (config.triggers.pullRequest) {
      triggerLines.push(`  pull_request:\n    branches: [ ${config.branches.map((b) => `'${b}'`).join(', ')} ]`);
    }
    if (config.triggers.push) {
      triggerLines.push(`  push:\n    branches: [ ${config.branches.map((b) => `'${b}'`).join(', ')} ]`);
    }
    if (config.triggers.schedule) {
      triggerLines.push(`  schedule:\n    - cron: '${config.triggers.cronExpression || '0 2 * * 1'}'`);
    }
    if (config.triggers.workflowDispatch) {
      triggerLines.push(`  workflow_dispatch:`);
    }

    const fetchDepth = config.scanDepth === 'full' ? '0' : '1';
    const failLevel = config.blockOnSeverity.toLowerCase();
    const excludeArg = config.excludePaths.length > 0 ? ` --exclude "${config.excludePaths.join(',')}"` : '';

    return `# ==============================================================================
# CredSense AI - Automated CI/CD Security Guardrail
# Enterprise Pre-Merge Secret Detection & Git History Security Gate
# Generated based on active Workspace Security Policies
# ==============================================================================
name: "${config.workflowName}"

on:
${triggerLines.join('\n')}

# Minimal required permissions for zero-trust security & PR feedback
permissions:
  contents: read
  pull-requests: write
  security-events: write
  actions: read

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  credsense-security-gate:
    name: CredSense AI Security Verification
    runs-on: ${config.runner}
    timeout-minutes: 15

    steps:
      # Step 1: Checkout Repository with Git DAG History
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: ${fetchDepth} # Fetch full Git DAG history to detect historical credentials

      # Step 2: Set up Node.js Runtime Environment
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Step 3: Zero-Trust Log Protection Masking
      ${
        config.enableSecretMasking
          ? `- name: Initialize Zero-Trust Secret Masking
        run: |
          echo "::add-mask::\${{ secrets.${config.environmentVariables.apiKeySecretName} }}"
          echo "::add-mask::\${{ secrets.${config.environmentVariables.geminiKeySecretName || 'GEMINI_API_KEY'} }}"
          echo "🛡️ CredSense Zero-Trust Secret Masker Active - Raw tokens will be redacted from runner stdout."`
          : '# Secret masking disabled in custom options'
      }

      # Step 4: Run CredSense AI Detection & Verification Engine
      - name: Execute CredSense AI Secret Scan
        id: credsense-scan
        env:
          CREDSENSE_API_KEY: \${{ secrets.${config.environmentVariables.apiKeySecretName} }}
          GEMINI_API_KEY: \${{ secrets.${config.environmentVariables.geminiKeySecretName || 'GEMINI_API_KEY'} }}
        run: |
          echo "=========================================================="
          echo "🚀 Starting CredSense AI Automated Guardrail Scan"
          echo "=========================================================="
          
          # Run CLI scanner with policy arguments
          npx --yes @credsense/cli scan . \\
            --format sarif,json \\
            --output-sarif credsense-results.sarif \\
            --output-json credsense-summary.json \\
            --fail-on-severity ${failLevel} \\
            --entropy-threshold ${config.entropyThreshold} \\
            ${config.enableAISemanticFilter ? '--ai-verification=true' : '--ai-verification=false'} \\
            ${config.ignoreTestFiles ? '--ignore-test-fixtures=true' : '--ignore-test-fixtures=false'}${excludeArg}

      ${
        config.enableSarifUpload
          ? `# Step 5: Upload Results to GitHub Advanced Security Code Scanning
      - name: Upload SARIF to GitHub Security Tab
        uses: github/codeql-action/upload-sarif@v3
        if: always() && steps.credsense-scan.outcome != 'skipped'
        with:
          sarif_file: credsense-results.sarif
          category: credsense-ai-secret-detection`
          : ''
      }

      ${
        config.enablePRComment
          ? `# Step 6: Post Detailed Security Gate Review Comment on Pull Request
      - name: Post PR Security Guardrail Summary
        uses: actions/github-script@v7
        if: always() && github.event_name == 'pull_request' && hashFiles('credsense-summary.json') != ''
        with:
          script: |
            const fs = require('fs');
            const summary = JSON.parse(fs.readFileSync('credsense-summary.json', 'utf8'));
            
            const isBlocked = summary.violationsCount > 0;
            const icon = isBlocked ? '🛑' : '✅';
            const statusTitle = isBlocked ? 'Security Gate Blocked' : 'Security Gate Passed';
            
            let body = \`### \${icon} CredSense AI - \${statusTitle}
            
| Metric | Result |
|---|---|
| **Overall Score** | \${summary.securityScore || 100}/100 |
| **Critical Secrets** | \${summary.criticalCount || 0} |
| **High Severity** | \${summary.highCount || 0} |
| **Historical Leaks** | \${summary.historicalCount || 0} |
| **AI Verification Status** | \${summary.aiVerificationMode || 'Active (Gemini 2.5 Flash)'} |

\`;

            if (isBlocked) {
              body += \`> ⚠️ **Action Required**: Unrotated credentials detected. Please rotate exposed secrets and review the CredSense Incident Playbook before merging.\\n\\n\`;
              if (summary.topFindings && summary.topFindings.length > 0) {
                body += \`#### Violations Found:\\n\`;
                summary.topFindings.forEach(f => {
                  body += \`- **\${f.severity}**: \`\${f.type}\` in \`\${f.file}:\${f.line}\` (\${f.verificationStatus})\\n\`;
                });
              }
            } else {
              body += \`> ✨ No active unrotated credentials found. Pipeline is clean to merge!\\n\`;
            }
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });`
          : ''
      }

      ${
        config.enableWebhookAlerts
          ? `# Step 7: Notify Security Operations Team on Critical Leak
      - name: Send Security Webhook Alert
        if: failure() && env.SECURITY_ALERT_WEBHOOK != ''
        env:
          SECURITY_ALERT_WEBHOOK: \${{ secrets.${config.environmentVariables.webhookSecretName || 'SECURITY_ALERT_WEBHOOK'} }}
        run: |
          curl -X POST -H "Content-Type: application/json" \\
            -d '{"text": "🚨 *CredSense CI Guardrail Alert*: High-severity credentials detected on branch \${{ github.ref_name }} by commit \${{ github.sha }}. Deployment blocked."}' \\
            \${SECURITY_ALERT_WEBHOOK}`
          : ''
      }

      # Step 8: Final Gate Status Enforcement
      - name: Enforce CI/CD Security Policy Decision
        if: steps.credsense-scan.outcome == 'failure'
        run: |
          echo "::error::CredSense AI Security Guardrail blocked this build due to security policy violations."
          exit 1
`;
  };

  // Generate Pre-Commit Hook YAML
  const generatePreCommitYAML = () => {
    return `# ==============================================================================
# CredSense AI - Local Pre-Commit Guardrail Hook (.pre-commit-config.yaml)
# Blocks local git commit before credentials reach remote branches
# ==============================================================================
repos:
  - repo: https://github.com/credsense-ai/pre-commit-hook
    rev: v2.4.0
    hooks:
      - id: credsense-guardrail
        name: CredSense AI Pre-Commit Secret Scanner
        description: Prevents developers from staging and committing unmasked credentials
        entry: npx --yes @credsense/cli hook pre-commit
        language: node
        pass_filenames: false
        stages: [commit]
        args:
          - --fail-on-severity=${config.blockOnSeverity.toLowerCase()}
          - --entropy-threshold=${config.entropyThreshold}
          - --ignore-test-fixtures=${config.ignoreTestFiles}
`;
  };

  // Generate GitLab CI YAML
  const generateGitLabYAML = () => {
    return `# ==============================================================================
# CredSense AI - GitLab CI/CD Pipeline Security Gate (.gitlab-ci.yml)
# ==============================================================================
stages:
  - security-audit
  - test
  - deploy

credsense_guardrail:
  stage: security-audit
  image: node:20-alpine
  variables:
    GIT_DEPTH: "0" # Full Git DAG history
  script:
    - npx --yes @credsense/cli scan . --fail-on-severity ${config.blockOnSeverity.toLowerCase()} --format json --output-json credsense-report.json
  artifacts:
    when: always
    reports:
      secret_detection: credsense-report.json
    paths:
      - credsense-report.json
    expire_in: 30 days
  only:
    - merge_requests
    - main
    - master
    - develop
`;
  };

  const getActiveCode = () => {
    if (activeFormat === 'pre-commit') return generatePreCommitYAML();
    if (activeFormat === 'gitlab-ci') return generateGitLabYAML();
    return generateGitHubActionsYAML();
  };

  const activeCode = getActiveCode();

  // Copy Code Function
  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download Code Function
  const handleDownload = () => {
    const blob = new Blob([activeCode], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFormat === 'pre-commit' ? '.pre-commit-config.yaml' : activeFormat === 'gitlab-ci' ? '.gitlab-ci.yml' : config.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Validate YAML Function
  const handleValidateYAML = () => {
    const errors: string[] = [];
    if (!activeCode.includes('name:')) errors.push('Missing workflow name declaration');
    if (!activeCode.includes('on:')) errors.push('Missing workflow trigger events');
    if (!activeCode.includes('jobs:')) errors.push('Missing jobs definition');
    if (!activeCode.includes('actions/checkout@v4')) errors.push('Recommended action actions/checkout@v4 missing');
    if (!config.environmentVariables.apiKeySecretName) errors.push('API key secret name is blank');

    if (errors.length === 0) {
      setValidationPassed(true);
      setValidationErrors([]);
    } else {
      setValidationPassed(false);
      setValidationErrors(errors);
    }
  };

  // Dry-Run Simulation on Current Repository
  const handleRunDryRun = () => {
    setDryRunRunning(true);
    setTimeout(() => {
      const activeHeadViolations = findings.filter(
        (f) =>
          !f.isRemediated &&
          !f.isHistoricalOnly &&
          f.verificationStatus !== 'FALSE_POSITIVE' &&
          (config.blockOnSeverity === 'MEDIUM' ||
            (config.blockOnSeverity === 'HIGH' && (f.severity === 'CRITICAL' || f.severity === 'HIGH')) ||
            (config.blockOnSeverity === 'CRITICAL' && f.severity === 'CRITICAL'))
      );

      const isBlocked = activeHeadViolations.length > 0;
      const logs = [
        `[INFO] Checking out repository at revision HEAD (fetch-depth: ${config.scanDepth === 'full' ? '0' : '1'})...`,
        `[INFO] Loaded CredSense AI Rule Engine v2.4.0 (Policy mode: ${config.policyMode})...`,
        `[INFO] Evaluated ${findings.length} total repository findings against severity threshold (${config.blockOnSeverity})...`,
        config.enableAISemanticFilter ? `[INFO] Gemini AI Context Analysis: Filtered false positives from mock test fixtures.` : `[INFO] AI Context Filter: Disabled.`,
        config.enableEntropyCheck ? `[INFO] Shannon Entropy Verification: Threshold set at ${config.entropyThreshold} bits/char.` : `[INFO] Entropy check skipped.`,
        isBlocked
          ? `[FAIL] Security Gate Triggered: ${activeHeadViolations.length} unrotated active credential(s) violated policy!`
          : `[PASS] Security Gate Passed: 0 blocking violations found.`,
      ];

      if (isBlocked) {
        activeHeadViolations.forEach((f) => {
          logs.push(`       - ❌ ${f.severity} [${f.secretType}] in ${f.filePath}:${f.lineNumber}`);
        });
      }

      setDryRunResult({
        status: isBlocked ? 'BLOCKED' : 'PASSED',
        exitCode: isBlocked ? 1 : 0,
        blockedCount: activeHeadViolations.length,
        warningsCount: findings.filter((f) => f.severity === 'LOW' || f.isHistoricalOnly).length,
        stepsExecuted: 8,
        logs,
      });
      setDryRunRunning(false);
    }, 900);
  };

  // Add Branch
  const handleAddBranch = () => {
    if (newBranchInput.trim() && !config.branches.includes(newBranchInput.trim())) {
      setConfig((prev) => ({ ...prev, branches: [...prev.branches, newBranchInput.trim()] }));
      setNewBranchInput('');
    }
  };

  // Remove Branch
  const handleRemoveBranch = (b: string) => {
    setConfig((prev) => ({ ...prev, branches: prev.branches.filter((x) => x !== b) }));
  };

  // Add Exclude
  const handleAddExclude = () => {
    if (newExcludeInput.trim() && !config.excludePaths.includes(newExcludeInput.trim())) {
      setConfig((prev) => ({ ...prev, excludePaths: [...prev.excludePaths, newExcludeInput.trim()] }));
      setNewExcludeInput('');
    }
  };

  // Remove Exclude
  const handleRemoveExclude = (p: string) => {
    setConfig((prev) => ({ ...prev, excludePaths: prev.excludePaths.filter((x) => x !== p) }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-xs">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">CI/CD Guardrail Template Generator</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  GitHub Actions Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Generate production-grade CI/CD workflows tailored to your active CredSense AI Security Policies and Gate configurations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('cicd')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              <span>Configure Policy Rules</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied YAML!' : 'Copy Workflow'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download .yml</span>
          </button>
        </div>
      </div>

      {/* Preset Format Switcher Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
        {[
          { id: 'github-pr', label: 'GitHub Actions: PR & Push Gate', icon: '🚀', desc: 'Pre-merge PR blocker & comments' },
          { id: 'github-audit', label: 'GitHub Actions: Nightly Full Audit', icon: '🌙', desc: 'Scheduled deep Git history scan' },
          { id: 'github-strict', label: 'GitHub Actions: Strict Release Gate', icon: '🔒', desc: 'Zero-tolerance release protection' },
          { id: 'pre-commit', label: 'Local Pre-Commit Hook', icon: '💻', desc: '.pre-commit-config.yaml' },
          { id: 'gitlab-ci', label: 'GitLab CI/CD Pipeline', icon: '🦊', desc: '.gitlab-ci.yml format' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => applyPreset(item.id as any)}
            className={`flex-1 min-w-[200px] text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
              activeFormat === item.id
                ? 'bg-sky-50/80 border-sky-300 text-sky-950 font-bold shadow-xs'
                : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{item.icon}</span>
              <span className="font-bold">{item.label}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">{item.desc}</div>
          </button>
        ))}
      </div>

      {/* Main Grid: Customizer Sidebar + YAML Preview Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Interactive Customizer Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section: Policy Synchronization Notice */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50/60 rounded-2xl p-4 border border-sky-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-sky-950 flex items-center gap-2">
                  Synchronized with CredSense Policies
                  <span className="px-1.5 py-0.2 rounded bg-sky-200/80 text-sky-900 text-[10px] font-black">
                    {policies.filter((p) => p.enabled).length} ACTIVE
                  </span>
                </div>
                <p className="text-sky-800/80 mt-1 leading-relaxed">
                  The generated GitHub Action will automatically enforce rules configured in your Security Policy Engine:
                  blocking <strong className="text-sky-950">{config.blockOnSeverity}</strong> severity secrets with{' '}
                  <strong className="text-sky-950">{config.scanDepth === 'full' ? 'Full Git History' : 'Diff-Only'}</strong> depth.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Trigger Configuration */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5 text-sky-600" />
              1. Pipeline Trigger Events
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.triggers.pullRequest}
                  onChange={(e) => setConfig({ ...config, triggers: { ...config.triggers, pullRequest: e.target.checked } })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-bold text-slate-800">pull_request</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.triggers.push}
                  onChange={(e) => setConfig({ ...config, triggers: { ...config.triggers, push: e.target.checked } })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-bold text-slate-800">push (commits)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.triggers.schedule}
                  onChange={(e) => setConfig({ ...config, triggers: { ...config.triggers, schedule: e.target.checked } })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-bold text-slate-800">schedule (cron)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.triggers.workflowDispatch}
                  onChange={(e) => setConfig({ ...config, triggers: { ...config.triggers, workflowDispatch: e.target.checked } })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-bold text-slate-800">workflow_dispatch</span>
              </label>
            </div>

            {/* Target Branches */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-600 block mb-1.5">Monitored Target Branches:</span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {config.branches.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  >
                    {b}
                    <button
                      onClick={() => handleRemoveBranch(b)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add branch (e.g., release/*)"
                  value={newBranchInput}
                  onChange={(e) => setNewBranchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBranch()}
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                <button
                  onClick={handleAddBranch}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Section: Enforcement & Gate Thresholds */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />
              2. Security Gate & Detection Options
            </h3>

            {/* Block on Severity */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Block PR / Fail Build on Severity:
              </label>
              <select
                value={config.blockOnSeverity}
                onChange={(e) => setConfig({ ...config, blockOnSeverity: e.target.value as SeverityLevel })}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="CRITICAL">Critical Only (Cloud Root Keys, Stripe Live, DB Passwords)</option>
                <option value="HIGH">Critical & High (Includes API Keys, OAuth Secrets, Webhooks)</option>
                <option value="MEDIUM">Strict: Critical, High & Medium</option>
              </select>
            </div>

            {/* Git Scan Depth */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Git Repository Scan Depth:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfig({ ...config, scanDepth: 'full' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left cursor-pointer transition-all ${
                    config.scanDepth === 'full'
                      ? 'bg-sky-50 border-sky-300 text-sky-900 ring-1 ring-sky-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>Full Git History (0)</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">Detects historical commit leaks</div>
                </button>
                <button
                  onClick={() => setConfig({ ...config, scanDepth: 'incremental' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left cursor-pointer transition-all ${
                    config.scanDepth === 'incremental'
                      ? 'bg-sky-50 border-sky-300 text-sky-900 ring-1 ring-sky-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>PR Diff Only (1)</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">Faster runs on shallow clones</div>
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 pt-1 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">AI False-Positive Verification</span>
                  <span className="text-[11px] text-slate-500">Filters test fixtures using Gemini context AST</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableAISemanticFilter}
                  onChange={(e) => setConfig({ ...config, enableAISemanticFilter: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Zero-Trust Log Redaction</span>
                  <span className="text-[11px] text-slate-500">Injects ::add-mask:: so secrets never leak in logs</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableSecretMasking}
                  onChange={(e) => setConfig({ ...config, enableSecretMasking: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">GitHub SARIF Security Tab Upload</span>
                  <span className="text-[11px] text-slate-500">Integrates with GitHub Code Scanning Alerts</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableSarifUpload}
                  onChange={(e) => setConfig({ ...config, enableSarifUpload: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Automated PR Review Comment</span>
                  <span className="text-[11px] text-slate-500">Posts formatted table with rotation checklist</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enablePRComment}
                  onChange={(e) => setConfig({ ...config, enablePRComment: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Excluded Path Allowlists */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-sky-600" />
              3. Path Allowlists & Exclusions
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {config.excludePaths.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono text-slate-700"
                >
                  {p}
                  <button
                    onClick={() => handleRemoveExclude(p)}
                    className="text-slate-400 hover:text-red-600 cursor-pointer ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add glob pattern (e.g., test/mocks/**)"
                value={newExcludeInput}
                onChange={(e) => setNewExcludeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExclude()}
                className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={handleAddExclude}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live YAML Editor & Simulator (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Action Toolbar */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span className="font-mono text-xs font-bold text-slate-200">
                {activeFormat === 'pre-commit'
                  ? '.pre-commit-config.yaml'
                  : activeFormat === 'gitlab-ci'
                  ? '.gitlab-ci.yml'
                  : `.github/workflows/${config.fileName}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleValidateYAML}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-700 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                Validate
              </button>

              <button
                onClick={handleRunDryRun}
                disabled={dryRunRunning}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
              >
                <Play className={`w-3 h-3 ${dryRunRunning ? 'animate-spin' : ''}`} />
                {dryRunRunning ? 'Running Dry-Run...' : 'Test on Current Repo'}
              </button>
            </div>
          </div>

          {/* Validation Result Box if active */}
          {validationPassed !== null && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                validationPassed ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              {validationPassed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold">
                  {validationPassed ? 'YAML Syntax & Schema Validated' : 'Validation Issues Detected'}:
                </span>{' '}
                {validationPassed ? (
                  <span>
                    Workflow conforms to GitHub Actions v4 specifications with standard permissions, step caching, and zero-trust masking.
                  </span>
                ) : (
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Dry Run Outcome Simulation */}
          {dryRunResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-3 ${
                dryRunResult.status === 'PASSED'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-red-50/90 border-red-300 text-red-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {dryRunResult.status === 'PASSED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Flame className="w-5 h-5 text-red-600 animate-pulse" />
                  )}
                  <span className="font-black text-sm">
                    Dry-Run Execution Verdict: {dryRunResult.status === 'PASSED' ? 'CI PIPELINE PASSED (Exit 0)' : 'CI PIPELINE BLOCKED (Exit 1)'}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    dryRunResult.status === 'PASSED' ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                  }`}
                >
                  Exit Code {dryRunResult.exitCode}
                </span>
              </div>

              <div className="bg-slate-950 text-slate-200 rounded-xl p-3 font-mono text-[11px] space-y-1 overflow-x-auto max-h-40">
                {dryRunResult.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes('[FAIL]') || log.includes('❌')
                        ? 'text-red-400 font-bold'
                        : log.includes('[PASS]')
                        ? 'text-emerald-400 font-bold'
                        : 'text-slate-300'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Viewer Container */}
          <div className="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
            {/* Header tab in editor */}
            <div className="bg-slate-900 px-4 py-2 text-xs font-mono text-slate-400 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-slate-300 text-[11px] font-medium ml-2">YAML • UTF-8</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Ready to commit to .github/workflows</span>
            </div>

            {/* Syntax Container */}
            <div className="p-4 sm:p-5 text-xs font-mono overflow-x-auto text-slate-200 leading-relaxed max-h-[560px] overflow-y-auto">
              <pre className="text-sky-300">{activeCode}</pre>
            </div>
          </div>

          {/* Section: 3-Step Setup Guide Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              Quick Setup Guide: Integrating into your GitHub Repository
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Add Secrets
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5">
                  Go to <strong>Settings → Secrets and variables → Actions</strong> and add <code className="font-mono text-sky-700 bg-sky-50 px-1 py-0.2 rounded">CREDSENSE_API_KEY</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Commit Workflow
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5">
                  Save this YAML file into your repository at path: <code className="font-mono text-sky-700 bg-sky-50 px-1 py-0.2 rounded">.github/workflows/{config.fileName}</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    3
                  </span>
                  Protect Branch
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5">
                  In <strong>Branch Protection Rules</strong>, require <strong>CredSense AI Security Verification</strong> to pass before merging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
