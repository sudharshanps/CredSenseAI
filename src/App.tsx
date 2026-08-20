import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ScanRepositoryView } from './components/ScanRepositoryView';
import { FindingsExplorerView } from './components/FindingsExplorerView';
import { GhostSecretsView } from './components/GhostSecretsView';
import { ExposureTimelineView } from './components/ExposureTimelineView';
import { ExposureGraphView } from './components/ExposureGraphView';
import { RiskIntelligenceView } from './components/RiskIntelligenceView';
import { AICopilotView } from './components/AICopilotView';
import { RemediationPlaybookView } from './components/RemediationPlaybookView';
import { CICDSimulationView } from './components/CICDSimulationView';
import { ExecutiveReportView } from './components/ExecutiveReportView';
import { PrivacyArchitectureView } from './components/PrivacyArchitectureView';
import { FindingDetailModal } from './components/FindingDetailModal';
import { SecurityPostureCenter } from './components/SecurityPostureCenter';
import { ExecutiveSummaryView } from './components/ExecutiveSummaryView';
import { RiskPrioritizationView } from './components/RiskPrioritizationView';
import { HeatmapAndGitRiskView } from './components/HeatmapAndGitRiskView';
import { DetectionIntelligenceView } from './components/DetectionIntelligenceView';
import { SecurityPoliciesAndCICDView } from './components/SecurityPoliciesAndCICDView';
import { CICDGuardrailTemplateView } from './components/CICDGuardrailTemplateView';
import { SecurityKnowledgeCenter } from './components/SecurityKnowledgeCenter';
import { GovernanceAuditAndAlertsView } from './components/GovernanceAuditAndAlertsView';
import { DemoPresentationModal } from './components/DemoPresentationModal';
import { JudgeQuickTour } from './components/JudgeQuickTour';
import { DashboardSummary, Finding, Scan, TimelineEvent } from './types';
import { safeFetch } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary>({
    totalScans: 0,
    totalFindings: 0,
    criticalFindings: 0,
    highFindings: 0,
    mediumFindings: 0,
    lowFindings: 0,
    falsePositives: 0,
    verifiedReal: 0,
    testExample: 0,
    historicalOnly: 0,
    averageRiskScore: 0,
    severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    typeBreakdown: [],
    recentFindings: [],
  });

  const [findings, setFindings] = useState<Finding[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);
  const [aiMode, setAiMode] = useState<string>('gemini-2.5-flash');
  const [filterSeverityState, setFilterSeverityState] = useState<string>('ALL');
  const [filterTypeState, setFilterTypeState] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Fetch initial summary & health
  const refreshData = async () => {
    try {
      const [health, sumData] = await Promise.all([
        safeFetch<any>('/api/health'),
        safeFetch<DashboardSummary>('/api/dashboard/summary'),
      ]);

      if (health?.aiVerificationMode) {
        setAiMode(health.aiVerificationMode);
      }

      if (sumData) {
        setSummary(sumData);
        if (sumData.latestScan) {
          setActiveScan(sumData.latestScan);
          try {
            const fData = await safeFetch<Finding[]>(`/api/scan/${sumData.latestScan.id}/findings`);
            if (Array.isArray(fData)) {
              setFindings(fData);
            }
          } catch (fErr) {
            console.warn('Error fetching scan findings:', fErr);
          }

          try {
            const tData = await safeFetch<TimelineEvent[]>(`/api/scan/${sumData.latestScan.id}/timeline`);
            if (Array.isArray(tData)) {
              setTimeline(tData);
            }
          } catch (tErr) {
            console.warn('Error fetching scan timeline:', tErr);
          }
        } else {
          setFindings(sumData.recentFindings || []);
        }
      }
    } catch (err) {
      console.warn('Initial fetch notice:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Load Demo Repository
  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      const data = await safeFetch<any>('/api/demo/load', { method: 'POST' });
      if (data.scan) {
        setActiveScan(data.scan);
      }
      if (data.findings) {
        setFindings(data.findings);
      }
      if (data.timeline) {
        setTimeline(data.timeline);
      }
      await refreshData();
      showNotification('Demo repository loaded successfully with Git history!');
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Failed to generate demo repository.');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleScanComplete = async () => {
    await refreshData();
    setActiveTab('findings');
    showNotification('Scan complete! Vulnerabilities prioritized.');
  };

  const handleToggleRemediate = async (findingId: string) => {
    const finding = findings.find((f) => f.id === findingId);
    const newStatus = !finding?.isRemediated;

    try {
      const resData = await safeFetch<any>(`/api/findings/${findingId}/remediate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRemediated: newStatus }),
      });

      if (resData.success || resData.finding) {
        setFindings((prev) =>
          prev.map((f) => (f.id === findingId ? { ...f, isRemediated: newStatus } : f))
        );
        if (selectedFinding?.id === findingId) {
          setSelectedFinding((prev) => (prev ? { ...prev, isRemediated: newStatus } : null));
        }
        await refreshData();
        showNotification(
          newStatus ? `Finding ${findingId} marked as remediated!` : `Finding ${findingId} reopened.`
        );
      }
    } catch (err: any) {
      console.error('Error updating remediation:', err);
      showNotification(err.message || 'Failed to update remediation status');
    }
  };

  const handleFilterSeverity = (sev: string) => {
    setFilterSeverityState(sev);
    setActiveTab('findings');
  };

  const handleFilterFindingType = (type: string) => {
    setFilterTypeState(type);
    setActiveTab('findings');
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-slate-900 font-sans selection:bg-sky-500/20 selection:text-sky-900 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-sky-300 bg-white px-4 py-3 text-xs font-bold text-sky-900 shadow-xl backdrop-blur-md animate-bounce">
          {notification}
        </div>
      )}

      {/* Global Enterprise Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadDemo={handleLoadDemo}
        isLoadingDemo={isLoadingDemo}
        aiMode={aiMode}
        repoName={activeScan?.repoName}
        totalFindings={summary.totalFindings}
        criticalFindings={summary.criticalFindings}
        lastScan={activeScan || undefined}
        securityScorecard={summary.securityScorecard}
        onOpenReport={() => setActiveTab('report')}
        onOpenScan={() => setActiveTab('scan')}
        onOpenPresentation={() => setIsPresentationOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab: Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            scan={activeScan}
            findings={findings}
            onNavigateTab={(t) => setActiveTab(t)}
            onSelectFinding={(f) => setSelectedFinding(f)}
            onFilterSeverity={handleFilterSeverity}
          />
        )}

        {/* Tab: Security Posture Center (7-Factor Scorecard & Simulator) */}
        {activeTab === 'posture' && (
          <SecurityPostureCenter
            summary={summary}
            findings={findings}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        )}

        {/* Tab: Scan Repository */}
        {activeTab === 'scan' && (
          <ScanRepositoryView
            onScanComplete={handleScanComplete}
            onLoadDemo={handleLoadDemo}
            isLoadingDemo={isLoadingDemo}
          />
        )}

        {/* Tab: Findings Explorer */}
        {activeTab === 'findings' && (
          <FindingsExplorerView
            findings={findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
            onToggleRemediate={handleToggleRemediate}
            initialSeverityFilter={filterSeverityState}
            initialTypeFilter={filterTypeState}
          />
        )}

        {/* Tab: Ghost Secrets Forensics & Intelligence */}
        {activeTab === 'ghosts' && (
          <GhostSecretsView
            findings={findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
            onToggleRemediate={handleToggleRemediate}
            onRefreshData={refreshData}
          />
        )}

        {/* Tab: Risk Prioritization & Incident Playbook */}
        {activeTab === 'remediation' && (
          <RiskPrioritizationView
            findings={findings}
            onOpenFinding={(f) => setSelectedFinding(f)}
            onToggleRemediate={handleToggleRemediate}
            onRefreshData={refreshData}
          />
        )}

        {/* Tab: Exposure Heatmap & Git Risks */}
        {activeTab === 'heatmap' && (
          <HeatmapAndGitRiskView
            findings={findings}
            scan={activeScan}
            onOpenFinding={(f) => setSelectedFinding(f)}
          />
        )}

        {/* Tab: Exposure Timeline */}
        {activeTab === 'timeline' && (
          <ExposureTimelineView
            timeline={timeline}
            findings={findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
          />
        )}

        {/* Tab: Exposure Graph */}
        {activeTab === 'graph' && (
          <ExposureGraphView
            scan={activeScan}
            findings={findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
          />
        )}

        {/* Tab: Detection Intelligence & AI Confidence Center */}
        {activeTab === 'intelligence' && (
          <DetectionIntelligenceView
            findings={findings}
            onOpenFinding={(f) => setSelectedFinding(f)}
          />
        )}

        {/* Tab: CI/CD Security Gate & Policies */}
        {activeTab === 'cicd' && (
          <SecurityPoliciesAndCICDView
            findings={findings}
            onOpenFinding={(f) => setSelectedFinding(f)}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        )}

        {/* Tab: CI/CD Guardrail Template (GitHub Actions YAML) */}
        {activeTab === 'guardrail' && (
          <CICDGuardrailTemplateView
            findings={findings}
            scan={activeScan}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        )}

        {/* Tab: Knowledge Center & Smart Recommendations */}
        {activeTab === 'knowledge' && (
          <SecurityKnowledgeCenter
            findings={findings}
            onOpenFinding={(f) => setSelectedFinding(f)}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        )}

        {/* Tab: Governance, Audit Logs & Alerts */}
        {activeTab === 'governance' && (
          <GovernanceAuditAndAlertsView
            summary={summary}
            findings={findings}
            onOpenFinding={(f) => setSelectedFinding(f)}
          />
        )}

        {/* Tab: Executive Summary & Enterprise Report */}
        {activeTab === 'report' && (
          <ExecutiveSummaryView
            summary={summary}
            findings={findings}
            scan={activeScan}
          />
        )}

        {/* Tab: AI Copilot */}
        {activeTab === 'copilot' && (
          <AICopilotView
            scan={activeScan}
            findings={findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
          />
        )}

        {/* Tab: Privacy & Architecture */}
        {activeTab === 'privacy' && (
          <PrivacyArchitectureView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-medium print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>CredSense AI • Enterprise Secret Detection & Git History Security</span>
          <span className="text-slate-400">Zero-Trust Masked Engine • Built for DevSecOps & Security Teams</span>
        </div>
      </footer>

      {/* Finding Detail Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onToggleRemediate={handleToggleRemediate}
        />
      )}

      {/* Demo Presentation Modal */}
      <DemoPresentationModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        onJumpToTab={(tabId) => setActiveTab(tabId)}
      />

      {/* Judge Quick Tour */}
      <JudgeQuickTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(tabId) => setActiveTab(tabId)}
      />
    </div>
  );
}
