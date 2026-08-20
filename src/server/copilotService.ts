/**
 * CredSense AI - Security Copilot Service
 * Context-aware AI assistant leveraging repository metadata, exposure history, and risk scores.
 * STRICT PRIVACY: Only redacted, masked metadata and relative metrics are sent to AI.
 */

import { GoogleGenAI } from '@google/genai';
import { Finding, Scan } from '../types';

export interface CopilotQueryOptions {
  message: string;
  scan?: Scan;
  findings: Finding[];
  history?: { role: string; content: string }[];
}

export interface CopilotResponse {
  reply: string;
  suggestedActions: string[];
  findingReferences: string[];
  mode: 'gemini' | 'local';
}

export async function processCopilotChat(options: CopilotQueryOptions): Promise<CopilotResponse> {
  const { message, scan, findings } = options;
  const apiKey = process.env.GEMINI_API_KEY;
  const hasGemini = !!apiKey && apiKey !== 'MY_GEMINI_API_KEY';

  // Build security metadata digest
  const totalFindings = findings.length;
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL');
  const highFindings = findings.filter((f) => f.severity === 'HIGH');
  const historicalOnly = findings.filter((f) => f.isHistoricalOnly);
  const activeHeadFindings = findings.filter((f) => !f.isHistoricalOnly);
  const falsePositives = findings.filter((f) => f.verificationStatus === 'FALSE_POSITIVE');
  const verifiedReal = findings.filter((f) => f.verificationStatus === 'REAL');

  // Sorted findings by risk and exposure
  const topRisk = [...findings].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  const longestExposed = [...findings].sort((a, b) => b.exposureDays - a.exposureDays).slice(0, 3);

  // Metadata summary (Redacted, no raw secret values)
  const metadataDigest = {
    repositoryName: scan?.repoName || 'Active Repository',
    totalCommitsScanned: scan?.totalCommitsScanned || 0,
    totalFilesScanned: scan?.totalFilesScanned || 0,
    totalFindings,
    criticalCount: criticalFindings.length,
    highCount: highFindings.length,
    historicalOnlyCount: historicalOnly.length,
    activeHeadCount: activeHeadFindings.length,
    falsePositiveCount: falsePositives.length,
    verifiedRealCount: verifiedReal.length,
    topRiskFindings: topRisk.map((f) => ({
      id: f.id,
      type: f.secretType,
      file: f.filePath,
      line: f.lineNumber,
      riskScore: f.riskScore,
      severity: f.severity,
      status: f.verificationStatus,
      isHistoricalOnly: f.isHistoricalOnly,
      exposureDays: f.exposureDays,
      maskedValue: f.maskedSecret,
      commitMessage: f.commitMessage,
    })),
    longestExposedFindings: longestExposed.map((f) => ({
      id: f.id,
      type: f.secretType,
      file: f.filePath,
      exposureDays: f.exposureDays,
      isHistoricalOnly: f.isHistoricalOnly,
    })),
  };

  // If Gemini is available, attempt AI completion
  if (hasGemini) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
          timeout: 7000,
        },
      });

      const systemPrompt = `You are CredSense Copilot, an elite DevSecOps & Git Security AI Assistant.
You help engineers and security teams prioritize, verify, and remediate leaked credentials in Git repositories.

RULES:
1. Base your answer strictly on the provided repository metadata.
2. Be direct, authoritative, structured, and technical yet accessible.
3. Recommend specific remediation priorities (e.g. revoke immediately, git-filter-repo, secrets manager).
4. Reference specific finding IDs (e.g. cs-demo-1-004) when discussing findings.
5. Emphasize the difference between secrets in HEAD (active code) and secrets trapped in historic Git commits.
6. Never invent fake secrets.

Current Repository Security Metadata:
${JSON.stringify(metadataDigest, null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }, { text: `User Question: "${message}"` }] },
        ],
      });

      const replyText = response.text?.trim();
      if (replyText) {
        // Extract referenced finding IDs
        const foundIds = findings
          .filter((f) => replyText.includes(f.id) || replyText.includes(f.secretType))
          .map((f) => f.id);

        return {
          reply: replyText,
          suggestedActions: generateSuggestedActions(message, findings),
          findingReferences: foundIds.slice(0, 4),
          mode: 'gemini',
        };
      }
    } catch (err) {
      console.log('[Copilot] Falling back to deterministic security engine:', err instanceof Error ? err.message : String(err));
    }
  }

  // Deterministic Expert Fallback Engine
  const localReply = generateDeterministicCopilotResponse(message, metadataDigest, findings);
  return {
    reply: localReply.text,
    suggestedActions: localReply.suggestedActions,
    findingReferences: localReply.findingReferences,
    mode: 'local',
  };
}

function generateSuggestedActions(query: string, findings: Finding[]): string[] {
  const actions: string[] = [];
  const q = query.toLowerCase();

  if (findings.some((f) => f.severity === 'CRITICAL')) {
    actions.push('Revoke Critical Credentials Now');
  }
  if (findings.some((f) => f.isHistoricalOnly)) {
    actions.push('Run Git History Filter (BFG/git-filter-repo)');
  }
  if (q.includes('head') || q.includes('active')) {
    actions.push('Migrate Secrets to .env & Vault');
  } else {
    actions.push('Export Executive PDF Report');
  }
  return actions;
}

function generateDeterministicCopilotResponse(
  query: string,
  digest: any,
  findings: Finding[]
): { text: string; suggestedActions: string[]; findingReferences: string[] } {
  const q = query.toLowerCase();
  const criticals = findings.filter((f) => f.severity === 'CRITICAL');
  const historical = findings.filter((f) => f.isHistoricalOnly);
  const activeHead = findings.filter((f) => !f.isHistoricalOnly);
  const falsePositives = findings.filter((f) => f.verificationStatus === 'FALSE_POSITIVE');
  const tests = findings.filter((f) => f.verificationStatus === 'TEST');

  // Query 1: Which secret should I fix first?
  if (q.includes('fix first') || q.includes('prioritize') || q.includes('start with') || q.includes('most dangerous')) {
    if (criticals.length > 0) {
      const top = criticals[0];
      return {
        text: `### Priority 1 Remediation Target: **${top.secretType}** (${top.id})
- **Location**: \`${top.filePath}\` (Line ${top.lineNumber})
- **Risk Score**: **${top.riskScore}/100 (${top.severity})**
- **Exposure Window**: Exposed for **${top.exposureDays} days** (${top.isHistoricalOnly ? 'Trapped in Git History' : 'Active in Working Tree HEAD'})

**Recommended Action**:
1. **Invalidate immediately** in provider console (${top.secretType}).
2. Rotate to an environment variable in AWS Secrets Manager or Doppler.
3. ${top.isHistoricalOnly ? 'Purge Git commit history using `git-filter-repo`.' : 'Delete from codebase and commit the removal.'}`,
        suggestedActions: ['View Finding Details', 'Copy Remediation Steps', 'Simulate CI/CD Gate'],
        findingReferences: [top.id],
      };
    }
    return {
      text: `### Remediation Overview
No **CRITICAL** vulnerabilities were detected in this repository. 
- High-risk items: **${digest.highCount}**
- Historical-only items: **${digest.historicalOnlyCount}**
Review any high-severity findings in the Findings Explorer.`,
      suggestedActions: ['View Findings', 'Generate Security Report'],
      findingReferences: [],
    };
  }

  // Query 2: Why is this finding critical?
  if (q.includes('why is this finding critical') || q.includes('why critical') || q.includes('risk explanation')) {
    const top = criticals[0] || findings[0];
    if (top) {
      return {
        text: `### Why **${top.id}** (${top.secretType}) is rated **CRITICAL (${top.riskScore}/100)**:
1. **Credential Classification**: High-privilege secret type capable of direct cloud/infrastructure access or data exfiltration.
2. **Exposure Window**: Active across Git history for **${top.exposureDays} days**, increasing likelihood of search-crawler indexing.
3. **Repository State**: ${top.isHistoricalOnly ? 'Secret was purged from latest commit, but remains fully recoverable in historic commit object blobs.' : 'Secret is currently committed in active working tree HEAD.'}
4. **AI Verification**: Classified as **${top.verificationStatus}** with ${Math.round(top.verificationConfidence * 100)}% confidence based on surrounding code context.`,
        suggestedActions: ['Inspect Finding Breakdown', 'Run Remediation Playbook'],
        findingReferences: [top.id],
      };
    }
  }

  // Query 3: Longest exposed credentials
  if (q.includes('longest') || q.includes('exposure duration') || q.includes('time')) {
    const longest = [...findings].sort((a, b) => b.exposureDays - a.exposureDays).slice(0, 3);
    const lines = longest.map(
      (f, i) =>
        `${i + 1}. **${f.secretType}** (\`${f.filePath}\`): **${f.exposureDays} days** exposure — *${f.isHistoricalOnly ? 'Historical in commit ' + f.shortCommitId : 'Active in HEAD'}* [${f.id}]`
    );
    return {
      text: `### Longest Exposed Credentials in Version Control:
${lines.join('\n\n')}

> **Security Note**: Secrets exposed for more than 7 days have a significantly elevated likelihood of being scraped by public GitHub crawler bots or cloned into local developer environments.`,
      suggestedActions: ['Check Exposure Timeline', 'Purge Git History'],
      findingReferences: longest.map((f) => f.id),
    };
  }

  // Query 4: Secrets that still exist in HEAD
  if (q.includes('head') || q.includes('exist in head') || q.includes('active')) {
    const lines = activeHead.map(
      (f, i) =>
        `${i + 1}. **${f.secretType}** at \`${f.filePath}:${f.lineNumber}\` (${f.severity} — Risk: ${f.riskScore})`
    );
    return {
      text: `### Active Secrets in Current HEAD (${activeHead.length} total):
${lines.length > 0 ? lines.join('\n') : 'No active secrets in current HEAD! All leaks are isolated to historic commits.'}

**Immediate Step**: Replace all hardcoded values in these files with \`process.env\` variables and add private configuration files to \`.gitignore\`.`,
      suggestedActions: ['Filter Head Findings', 'Copy .env Template'],
      findingReferences: activeHead.slice(0, 3).map((f) => f.id),
    };
  }

  // Query 5: False positives / Noise reduction
  if (q.includes('false positive') || q.includes('noise') || q.includes('test') || q.includes('example')) {
    const nonReal = [...falsePositives, ...tests];
    return {
      text: `### Noise Reduction Analysis
CredSense AI evaluated **${digest.totalFindings} candidate patterns** and identified:
- **${falsePositives.length} False Positives** (e.g. synthetic hashes, placeholders, public keys)
- **${tests.length} Non-Production / Test Credentials** (e.g. test fixtures, mocks)
- **Noise Reduction Rate**: **${Math.round((nonReal.length / Math.max(1, digest.totalFindings)) * 100)}%**

This intelligent filtering prevents alert fatigue so security engineers only spend time remediating authentic production risks.`,
      suggestedActions: ['View Noise Reduction Panel', 'Filter Real Findings Only'],
      findingReferences: nonReal.slice(0, 3).map((f) => f.id),
    };
  }

  // Query 6: Summary / General Posture
  return {
    text: `### Repository Security Posture Summary
- **Target Repository**: \`${digest.repositoryName}\`
- **Total Scanned**: ${digest.totalFilesScanned} files, ${digest.totalCommitsScanned} historical commits
- **Total Findings**: **${digest.totalFindings}**
  - **Critical Risk**: ${digest.criticalCount}
  - **High Risk**: ${digest.highCount}
  - **Trapped in Git History Only**: ${digest.historicalOnlyCount}
  - **Active in Working Tree (HEAD)**: ${digest.activeHeadCount}
  - **Noise Filtered (Test / False Positives)**: ${falsePositives.length + tests.length}

**Key Differentiator**: Traditional scanners only look at HEAD. CredSense AI uncovered **${digest.historicalOnlyCount} historical leaks** that developers thought were removed, and verified authentic credentials using AI context analysis.`,
    suggestedActions: ['Check Priority #1 Risk', 'Export Security Report', 'View Exposure Graph'],
    findingReferences: criticals.slice(0, 2).map((f) => f.id),
  };
}
