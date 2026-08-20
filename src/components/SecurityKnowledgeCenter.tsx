import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Shield,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Lock,
  Terminal,
  Key,
  ExternalLink,
  Search,
  ArrowRight,
  Database,
  Cloud,
  CreditCard,
  GitBranch,
} from 'lucide-react';
import { Finding } from '../types';

interface SecurityKnowledgeCenterProps {
  findings: Finding[];
  onOpenFinding?: (finding: Finding) => void;
  onNavigateTab?: (tabId: string) => void;
}

interface KnowledgeItem {
  id: string;
  name: string;
  category: string;
  iconName: string;
  whatIsIt: string;
  whyDangerous: string;
  howDetected: string;
  remediation: string[];
  bestPractices: string[];
}

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'aws',
    name: 'AWS Access & Secret Keys',
    category: 'Cloud Infrastructure',
    iconName: 'cloud',
    whatIsIt: 'Long-term cryptographic credentials (AKIA...) used to authenticate programmatic requests to Amazon Web Services REST APIs.',
    whyDangerous: 'Gives adversaries direct access to provision high-cost GPU/EC2 instances, exfiltrate S3 bucket data, or delete production RDS databases.',
    howDetected: 'Regex matching 20-character AKIA/ASIA prefix paired with Shannon high-entropy secret token (40 characters).',
    remediation: [
      'Deactivate the access key in AWS IAM Console immediately.',
      'Delete the hardcoded key from source files.',
      'Use AWS IAM Roles for EC2/ECS/EKS (temporary STS tokens) instead of static keys.',
      'Purge the Git commit history containing the key using git-filter-repo.',
    ],
    bestPractices: [
      'Never create static IAM user access keys for production applications.',
      'Use AWS IAM Identity Center or AWS Secrets Manager with automatic rotation.',
      'Set up AWS CloudTrail and AWS Budgets alerts for unexpected API activity.',
    ],
  },
  {
    id: 'github',
    name: 'GitHub & GitLab Personal Access Tokens',
    category: 'VCS & CI/CD',
    iconName: 'git',
    whatIsIt: 'OAuth tokens (ghp_..., glpat-...) granting repository read/write access, workflow trigger permissions, and package registry management.',
    whyDangerous: 'Allows attackers to clone private repositories, inject malicious code into CI/CD build scripts (supply chain attack), and tamper with releases.',
    howDetected: 'Prefix matching (ghp_, gho_, glpat-) followed by base62 alphanumeric hash validation.',
    remediation: [
      'Revoke the token in GitHub Developer Settings immediately.',
      'Generate fine-grained tokens scoped strictly to single repositories.',
      'Verify GitHub audit logs for anomalous clones or workflow executions.',
    ],
    bestPractices: [
      'Use fine-grained personal access tokens with short expiration dates (<= 30 days).',
      'Use GitHub Apps or OpenID Connect (OIDC) for CI/CD authentications rather than long-lived PATs.',
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe & Payment Gateway Keys',
    category: 'Financial / Payments',
    iconName: 'card',
    whatIsIt: 'Secret API keys (sk_live_..., rk_live_...) used to create charges, process refunds, and access customer payment profiles.',
    whyDangerous: 'Enables fraudulent charges, financial theft, customer credit card billing data exposure, and PCI-DSS compliance failure.',
    howDetected: 'Strict prefix search (sk_live_, rk_live_) and Shannon entropy distribution analysis.',
    remediation: [
      'Roll the restricted secret key in Stripe Dashboard -> Developers -> API keys.',
      'Audit the Stripe event logs for any unexpected charge/refund requests.',
      'Update backend environment variables with the newly rolled key.',
    ],
    bestPractices: [
      'Always use Restricted Keys (rk_live_) granting only minimal necessary endpoints.',
      'Keep Publishable keys (pk_live_) on frontend, but never let secret keys touch client code.',
    ],
  },
  {
    id: 'database',
    name: 'Database Connection URIs & Passwords',
    category: 'Databases',
    iconName: 'db',
    whatIsIt: 'Full database connection strings (postgres://, mongodb+srv://, mysql://) containing usernames, plaintext passwords, and host addresses.',
    whyDangerous: 'Allows direct connection to relational/NoSQL tables, enabling data exfiltration, database dropping, or ransomware injection.',
    howDetected: 'URI protocol pattern matching followed by credentials extraction in URI authority block.',
    remediation: [
      'Change the database user password immediately in database host.',
      'Restrict database security group / firewall rules to private VPC subnets.',
      'Store database credentials in environment variables or cloud secret stores.',
    ],
    bestPractices: [
      'Enable SSL/TLS certificate verification for all database connections.',
      'Implement IAM database authentication (e.g. AWS RDS IAM Auth) to eliminate static passwords.',
    ],
  },
  {
    id: 'private_key',
    name: 'RSA / SSH / TLS Private Keys',
    category: 'Cryptographic Keys',
    iconName: 'key',
    whatIsIt: 'Asymmetric private keys (-----BEGIN RSA PRIVATE KEY-----) used for SSH shell authentication, JWT signing, and SSL/TLS decryption.',
    whyDangerous: 'Grants root shell access to production servers, enables man-in-the-middle decryption of traffic, and allows spoofing user authentication tokens.',
    howDetected: 'PEM header search matching BEGIN/END PRIVATE KEY delimiters and Base64 body parsing.',
    remediation: [
      'Remove the public key from authorized_keys files on all servers.',
      'Generate a new Ed25519 or RSA-4096 keypair.',
      'Deploy the new public key and revoke the old compromised key.',
    ],
    bestPractices: [
      'Use SSH certificates and short-lived certificate authorities (e.g., HashiCorp Vault, Teleport).',
      'Never store raw private key PEM files inside Git repositories.',
    ],
  },
];

export function SecurityKnowledgeCenter({
  findings,
  onOpenFinding,
  onNavigateTab,
}: SecurityKnowledgeCenterProps) {
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string>('aws');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedItem = KNOWLEDGE_BASE.find((k) => k.id === selectedKnowledgeId) || KNOWLEDGE_BASE[0];

  const filteredKnowledge = KNOWLEDGE_BASE.filter(
    (k) =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.whatIsIt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // SECTION 17: Generate Smart Dynamic Recommendations based on actual scan findings
  const generateRecommendations = () => {
    const recs = [];
    const critCount = findings.filter((f) => f.severity === 'CRITICAL' && !f.isRemediated).length;
    const historicalCount = findings.filter((f) => f.isHistoricalOnly && !f.isRemediated).length;
    const hasAws = findings.some((f) => f.secretType.toLowerCase().includes('aws'));
    const hasDb = findings.some((f) => f.secretType.toLowerCase().includes('database') || f.secretType.toLowerCase().includes('postgres'));

    if (critCount > 0) {
      recs.push({
        title: 'Emergency Rotation: Revoke Active Production Keys',
        priority: 'P0 - URGENT',
        description: `Found ${critCount} active critical secrets in current HEAD. Disable these credentials immediately in cloud provider consoles to prevent unauthorized access.`,
        actionTab: 'remediation',
        actionLabel: 'Open Remediation Playbook',
      });
    }

    if (historicalCount > 0) {
      recs.push({
        title: 'Purge Git History Blobs with git-filter-repo',
        priority: 'P1 - HIGH',
        description: `${historicalCount} credentials have been deleted from files but remain accessible in Git commit history. Run git-filter-repo to sanitize the commit tree.`,
        actionTab: 'heatmap',
        actionLabel: 'Inspect Risky Commits',
      });
    }

    if (hasAws) {
      recs.push({
        title: 'Migrate AWS Static Keys to IAM Roles & STS',
        priority: 'P2 - ARCHITECTURE',
        description: 'Eliminate hardcoded AWS access keys by configuring IAM instance profiles, ECS task roles, or OIDC GitHub Actions workflows.',
        actionTab: 'policies',
        actionLabel: 'View Policy Guidelines',
      });
    }

    recs.push({
      title: 'Integrate Pre-commit Secret Scanning Hook',
      priority: 'P2 - PREVENTATIVE',
      description: 'Block developers from committing credentials before git push using pre-commit hooks or CredSense CLI integration.',
      actionTab: 'cicd',
      actionLabel: 'Configure CI/CD Gate',
    });

    return recs;
  };

  const smartRecommendations = generateRecommendations();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Security Knowledge Center & Smart Recommendations</h2>
              <p className="text-xs text-slate-500">Curated security encyclopedia, remediation guides, and dynamic repository advice</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 17: Smart Dynamic Recommendations Engine */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-sky-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Smart Recommendations Engine
          </span>
          <span className="text-xs text-sky-200">Generated from live repository findings</span>
        </div>
        <h3 className="text-xl font-black text-white">Actionable Security Recommendations</h3>
        <p className="text-xs text-sky-100/80 mt-1 max-w-2xl">
          Contextual steps prioritized by CredSense AI to rapidly boost your repository security posture.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {smartRecommendations.map((rec, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    rec.priority.startsWith('P0') ? 'bg-red-500 text-white' : rec.priority.startsWith('P1') ? 'bg-amber-500 text-white' : 'bg-sky-500 text-white'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-2">{rec.title}</h4>
                <p className="text-xs text-sky-100/90 mt-1">{rec.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => onNavigateTab && onNavigateTab(rec.actionTab)}
                  className="px-3 py-1.5 bg-white text-slate-900 hover:bg-sky-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {rec.actionLabel} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 16: Security Knowledge Base */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Knowledge Index Left */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search secret types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            {filteredKnowledge.map((item) => {
              const isSelected = selectedKnowledgeId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedKnowledgeId(item.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{item.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.category}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Knowledge Article Right */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">{selectedItem.category}</div>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{selectedItem.name}</h3>
          </div>

          {/* What is it */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">What is it?</h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {selectedItem.whatIsIt}
            </p>
          </div>

          {/* Why is it dangerous */}
          <div>
            <h4 className="text-xs font-bold uppercase text-red-600 tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Why is it dangerous when exposed?
            </h4>
            <p className="text-xs sm:text-sm text-red-950 leading-relaxed bg-red-50/70 p-3 rounded-xl border border-red-200">
              {selectedItem.whyDangerous}
            </p>
          </div>

          {/* How detected */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">How CredSense Detects This</h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
              {selectedItem.howDetected}
            </p>
          </div>

          {/* Remediation Steps */}
          <div>
            <h4 className="text-xs font-bold uppercase text-emerald-700 tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Standard Remediation Procedure
            </h4>
            <div className="space-y-2">
              {selectedItem.remediation.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              Architectural Best Practices
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
              {selectedItem.bestPractices.map((bp, idx) => (
                <li key={idx} className="leading-relaxed">{bp}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
