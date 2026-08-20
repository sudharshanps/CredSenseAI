/**
 * CredSense AI - Secret Detection & Entropy Engine
 * Safe masking, pattern recognition, and entropy evaluation.
 */

export interface DetectedCandidate {
  secretType: string;
  detector: string;
  rawMatched: string;
  maskedSecret: string;
  variableName: string;
  filePath: string;
  lineNumber: number;
  lineContent: string;
  surroundingContext: string;
  entropyScore: number;
  baseConfidence: number;
  sensitivityWeight: number; // 0 - 30
}

interface SecretPattern {
  name: string;
  category: string;
  regex: RegExp;
  detector: string;
  sensitivity: number; // 0-30
  minEntropy?: number;
  valueExtractor?: (match: RegExpExecArray) => { value: string; varName?: string };
}

// Shannon entropy calculation
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const charMap: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    charMap[c] = (charMap[c] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in charMap) {
    const p = charMap[char] / len;
    entropy -= p * Math.log2(p);
  }
  return parseFloat(entropy.toFixed(3));
}

// Mask secret for secure display and safe AI payload
export function maskSecret(secret: string): string {
  if (!secret) return '***';
  const clean = secret.trim().replace(/^['"`]|['"`]$/g, '');
  const len = clean.length;
  if (len <= 6) {
    return '******';
  }
  if (len <= 12) {
    return `${clean.slice(0, 2)}${'*'.repeat(len - 4)}${clean.slice(-2)}`;
  }
  const prefixLen = Math.min(4, Math.floor(len / 4));
  const suffixLen = Math.min(4, Math.floor(len / 4));
  const maskLen = Math.max(6, len - prefixLen - suffixLen);
  return `${clean.slice(0, prefixLen)}${'*'.repeat(maskLen)}${clean.slice(-suffixLen)}`;
}

// Secret detection pattern catalog
export const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: 'AWS Access Key ID',
    category: 'Cloud Credentials',
    detector: 'regex-aws-key',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    sensitivity: 28,
    valueExtractor: (match) => ({ value: match[0] }),
  },
  {
    name: 'AWS Secret Access Key',
    category: 'Cloud Credentials',
    detector: 'regex-aws-secret',
    regex: /(?:aws_secret_access_key|aws_secret|aws_key|secret_key)\s*[:=]\s*['"]?([a-zA-Z0-9/+=]{40})['"]?/gi,
    sensitivity: 30,
    valueExtractor: (match) => ({ value: match[1] || match[0], varName: 'aws_secret_access_key' }),
  },
  {
    name: 'GitHub Personal Access Token',
    category: 'Source Control Tokens',
    detector: 'regex-github-pat',
    regex: /(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,82}/g,
    sensitivity: 26,
    valueExtractor: (match) => ({ value: match[0] }),
  },
  {
    name: 'Google API Key',
    category: 'Cloud Credentials',
    detector: 'regex-google-api',
    regex: /AIza[0-9A-Za-z\-_]{35}/g,
    sensitivity: 24,
    valueExtractor: (match) => ({ value: match[0] }),
  },
  {
    name: 'Slack Token / Webhook',
    category: 'Communication Tokens',
    detector: 'regex-slack-token',
    regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
    sensitivity: 22,
    valueExtractor: (match) => ({ value: match[0] }),
  },
  {
    name: 'Private RSA/EC/OpenSSH Key',
    category: 'Cryptographic Keys',
    detector: 'regex-private-key',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
    sensitivity: 30,
    valueExtractor: (match) => ({ value: match[0], varName: 'PRIVATE_KEY' }),
  },
  {
    name: 'JSON Web Token (JWT)',
    category: 'Authentication Tokens',
    detector: 'regex-jwt-token',
    regex: /eyJ[A-Za-z0-9-_=]{10,}\.eyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_.+/=]{10,}/g,
    sensitivity: 18,
    minEntropy: 3.5,
    valueExtractor: (match) => ({ value: match[0] }),
  },
  {
    name: 'Database Connection String with Password',
    category: 'Database Credentials',
    detector: 'regex-db-conn-string',
    regex: /(?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis):\/\/[a-zA-Z0-9_\-\.]+:(?:[^@\s:'"]+)@[a-zA-Z0-9_\-\.]+(?::\d+)?\/[a-zA-Z0-9_\-\.]*/gi,
    sensitivity: 27,
    valueExtractor: (match) => ({ value: match[0], varName: 'DATABASE_URL' }),
  },
  {
    name: 'Generic API Key / Secret Assignment',
    category: 'API Credentials',
    detector: 'regex-generic-api-key',
    regex: /(?:api[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token|client[_-]?secret)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{16,64})['"]/gi,
    sensitivity: 20,
    minEntropy: 3.2,
    valueExtractor: (match) => ({ value: match[1], varName: match[0].split(/[=:]/)[0].trim() }),
  },
  {
    name: 'Password in Source / Config',
    category: 'Authentication',
    detector: 'regex-password-assignment',
    regex: /(?:password|passwd|pwd|db_pass|admin_pass)\s*[:=]\s*['"]([^'"]{6,50})['"]/gi,
    sensitivity: 20,
    valueExtractor: (match) => ({ value: match[1], varName: match[0].split(/[=:]/)[0].trim() }),
  },
  {
    name: 'Stripe Secret Key',
    category: 'Payment Credentials',
    detector: 'regex-stripe-key',
    regex: /sk_(?:live|test)_[0-9a-zA-Z]{24,34}/g,
    sensitivity: 25,
    valueExtractor: (match) => ({ value: match[0] }),
  },
];

// Scan a single file content or diff line by line
export function scanFileContent(filePath: string, content: string): DetectedCandidate[] {
  const findings: DetectedCandidate[] = [];
  const lines = content.split('\n');

  // Ignore binary files, large lock files, or map files
  const lowerPath = filePath.toLowerCase();
  if (
    lowerPath.endsWith('.lock') ||
    lowerPath.endsWith('.min.js') ||
    lowerPath.endsWith('.min.css') ||
    lowerPath.endsWith('.map') ||
    lowerPath.includes('node_modules/') ||
    lowerPath.includes('.git/')
  ) {
    return [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim().length === 0) continue;

    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(line)) !== null) {
        const extracted = pattern.valueExtractor ? pattern.valueExtractor(match) : { value: match[0] };
        const secretVal = extracted.value;
        if (!secretVal || secretVal.length < 6) continue;

        const entropy = calculateShannonEntropy(secretVal);
        if (pattern.minEntropy && entropy < pattern.minEntropy) {
          continue; // Filter low entropy noise
        }

        // Build 5-line surrounding context
        const startLine = Math.max(0, i - 2);
        const endLine = Math.min(lines.length, i + 3);
        const contextLines = lines.slice(startLine, endLine).map((l, idx) => {
          const lineNum = startLine + idx + 1;
          const maskedLine = l.replace(secretVal, maskSecret(secretVal));
          return `${lineNum === i + 1 ? '>' : ' '} ${lineNum} | ${maskedLine}`;
        });

        // Determine base confidence
        let baseConfidence = 0.85;
        if (entropy > 3.8) baseConfidence += 0.1;
        if (entropy < 3.0) baseConfidence -= 0.15;
        baseConfidence = Math.max(0.4, Math.min(0.98, baseConfidence));

        findings.push({
          secretType: pattern.name,
          detector: pattern.detector,
          rawMatched: secretVal,
          maskedSecret: maskSecret(secretVal),
          variableName: extracted.varName || pattern.name,
          filePath,
          lineNumber: i + 1,
          lineContent: line.replace(secretVal, maskSecret(secretVal)),
          surroundingContext: contextLines.join('\n'),
          entropyScore: entropy,
          baseConfidence: parseFloat(baseConfidence.toFixed(2)),
          sensitivityWeight: pattern.sensitivity,
        });
      }
    }
  }

  return findings;
}
