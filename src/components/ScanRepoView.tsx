import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, CheckCircle2, Clock, Play, AlertCircle, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { Scan, ScanProgressStage } from '../types';

interface ScanRepoViewProps {
  onScanComplete: (scan: Scan) => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  activeScan: Scan | null;
}

export const ScanRepoView: React.FC<ScanRepoViewProps> = ({
  onScanComplete,
  onLoadDemo,
  isLoadingDemo,
  activeScan,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stagedScan, setStagedScan] = useState<Scan | null>(activeScan);
  const [currentStages, setCurrentStages] = useState<ScanProgressStage[]>([
    { id: '1_init', name: 'Repository unpacked & Git validation', status: 'pending' },
    { id: '2_source', name: 'Current source code scanning', status: 'pending' },
    { id: '3_history', name: 'Git history & commit blame analysis', status: 'pending' },
    { id: '4_secrets', name: 'Secret candidate detection & entropy analysis', status: 'pending' },
    { id: '5_ai', name: 'AI contextual verification & classification', status: 'pending' },
    { id: '6_risk', name: 'Risk scoring & remediation playbook generation', status: 'pending' },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.zip')) {
        setFile(droppedFile);
        setErrorMessage(null);
      } else {
        setErrorMessage('Please upload a valid .zip repository archive.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleUploadAndPrepare = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('repositoryZip', file);

    try {
      const response = await fetch('/api/scan/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to upload repository.');
      }

      const data = await response.json();
      setStagedScan(data.scan);
      setCurrentStages(data.scan.stages || currentStages);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartScan = async () => {
    if (!stagedScan) return;
    setIsScanning(true);
    setErrorMessage(null);

    // Animate stages for realistic feedback
    const stageIds = ['1_init', '2_source', '3_history', '4_secrets', '5_ai', '6_risk'];
    let step = 0;
    const interval = setInterval(() => {
      if (step < stageIds.length) {
        const activeId = stageIds[step];
        setCurrentStages((prev) =>
          prev.map((st, i) => {
            if (i < step) return { ...st, status: 'completed' };
            if (i === step) return { ...st, status: 'in_progress' };
            return { ...st, status: 'pending' };
          })
        );
        step++;
      }
    }, 450);

    try {
      const response = await fetch(`/api/scan/${stagedScan.id}/start`, {
        method: 'POST',
      });

      clearInterval(interval);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Scan failed.');
      }

      const data = await response.json();
      setCurrentStages((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
      setStagedScan(data.scan);
      onScanComplete(data.scan);
    } catch (err) {
      clearInterval(interval);
      setErrorMessage(err instanceof Error ? err.message : 'Scan execution failed');
      setCurrentStages((prev) =>
        prev.map((s) => (s.status === 'in_progress' ? { ...s, status: 'failed' } : s))
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Title & Description */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F141E] p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <UploadCloud className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white tracking-tight">Scan Repository</h2>
        <p className="mt-1.5 text-sm text-slate-400 max-w-lg mx-auto">
          Upload a Git repository ZIP to detect exposed secrets in source code and historical commits with AI context verification.
        </p>

        {/* Demo Shortcut */}
        <div className="mt-4 flex items-center justify-center space-x-3">
          <span className="text-xs text-slate-400">Want to test instantly?</span>
          <button
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="flex items-center space-x-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer"
          >
            {isLoadingDemo ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            <span>Load Demo Repository (1-Click)</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer ${
          file
            ? 'border-cyan-500/60 bg-cyan-950/10'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 group-hover:text-cyan-400 transition-colors">
          <FileArchive className="h-7 w-7" />
        </div>

        {file ? (
          <div className="mt-4 text-center">
            <span className="text-sm font-semibold text-white font-mono">{file.name}</span>
            <p className="text-xs text-slate-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to prepare</p>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-slate-200">
              Drag and drop your Git repository <span className="text-cyan-400 font-semibold">.ZIP</span> here
            </p>
            <p className="mt-1 text-xs text-slate-400">or click to browse local files (includes .git folder history)</p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {file && !stagedScan && (
          <button
            onClick={handleUploadAndPrepare}
            disabled={isUploading}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-6 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Unpacking Repository...</span>
              </>
            ) : (
              <>
                <FileArchive className="h-4 w-4" />
                <span>Upload & Validate Repository</span>
              </>
            )}
          </button>
        )}

        {stagedScan && (
          <button
            onClick={handleStartScan}
            disabled={isScanning || stagedScan.status === 'completed'}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-900/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running CredSense Pipeline...</span>
              </>
            ) : stagedScan.status === 'completed' ? (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Scan Completed</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Start Security Scan</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 6-Stage Progress Tracker */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F141E] p-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
          Security Analysis Pipeline
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Automated detection, history crawl, AI verification, and risk prioritization.</p>

        <div className="mt-5 space-y-3">
          {currentStages.map((stage, idx) => {
            const isDone = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';
            const isFailed = stage.status === 'failed';

            return (
              <div
                key={stage.id}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-colors ${
                  isDone
                    ? 'border-emerald-900/40 bg-emerald-950/10 text-slate-200'
                    : isInProgress
                    ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-200 animate-pulse'
                    : isFailed
                    ? 'border-rose-900/40 bg-rose-950/20 text-rose-300'
                    : 'border-slate-800/80 bg-slate-900/40 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isInProgress
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : isFailed
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : idx + 1}
                  </div>
                  <div>
                    <span className="text-xs font-medium">{stage.name}</span>
                    {stage.details && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{stage.details}</p>}
                  </div>
                </div>

                <div>
                  {isDone && <span className="text-[11px] font-semibold text-emerald-400">Completed</span>}
                  {isInProgress && (
                    <span className="flex items-center space-x-1 text-[11px] font-semibold text-cyan-400">
                      <Clock className="h-3 w-3 animate-spin" />
                      <span>Scanning...</span>
                    </span>
                  )}
                  {stage.status === 'pending' && <span className="text-[11px] text-slate-400">Pending</span>}
                </div>
              </div>
            );
          })}
        </div>

        {stagedScan && stagedScan.status === 'completed' && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Repository Scan Completed</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Found {stagedScan.findingsCount.total} secrets ({stagedScan.findingsCount.critical} Critical,{' '}
                  {stagedScan.findingsCount.high} High, {stagedScan.findingsCount.historicalOnly} in Git History).
                </p>
              </div>
            </div>
            <button
              onClick={() => onScanComplete(stagedScan)}
              className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <span>View Security Report</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
