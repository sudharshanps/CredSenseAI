import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  FolderArchive,
  Globe,
  FileText,
} from 'lucide-react';
import { safeFetch } from '../utils/api';

interface ScanRepositoryViewProps {
  onScanComplete: () => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
}

export function ScanRepositoryView({ onScanComplete, onLoadDemo, isLoadingDemo }: ScanRepositoryViewProps) {
  const [scanMode, setScanMode] = useState<'zip' | 'url' | 'snippet'>('zip');
  const [repoUrl, setRepoUrl] = useState('');
  const [snippetText, setSnippetText] = useState('');
  const [snippetRepoName, setSnippetRepoName] = useState('pasted-git-diff');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressStage, setScanProgressStage] = useState<number>(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    'Stage 1/5: Indexing Git commit object tree & working files...',
    'Stage 2/5: Executing Shannon entropy analysis & secret regex detectors...',
    'Stage 3/5: Redacting raw credentials and initiating AI contextual validation...',
    'Stage 4/5: Calculating exposure timeline and multi-factor risk scores...',
    'Stage 5/5: Building remediation playbooks & executive scorecard...',
  ];

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setSelectedFile(file);
        setScanError(null);
      } else {
        setScanError('Please select a valid .zip archive of your repository.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setSelectedFile(file);
        setScanError(null);
      } else {
        setScanError('Please select a valid .zip archive of your repository.');
      }
    }
  };

  const runPipelineAnimation = async () => {
    for (let i = 0; i < stages.length; i++) {
      setScanProgressStage(i);
      await new Promise((res) => setTimeout(res, 450));
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleStartScan = async () => {
    setScanError(null);
    setIsScanning(true);

    try {
      if (scanMode === 'zip') {
        if (!selectedFile) {
          setScanError('Please select a ZIP file to scan.');
          setIsScanning(false);
          return;
        }

        // Stage 1: Upload and validate repository ZIP
        let uploadResult: any;
        try {
          const base64Data = await readFileAsBase64(selectedFile);
          uploadResult = await safeFetch<any>('/api/scan/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Data,
              filename: selectedFile.name,
              repoName: selectedFile.name.replace(/\.zip$/i, ''),
            }),
          });
        } catch (uploadErr: any) {
          console.warn('Base64 upload retry with FormData:', uploadErr);
          const formData = new FormData();
          formData.append('repositoryZip', selectedFile);
          uploadResult = await safeFetch<any>('/api/scan/upload', {
            method: 'POST',
            body: formData,
          });
        }

        const scanId = uploadResult.scan_id || uploadResult.scanId;
        if (!scanId) {
          throw new Error('Upload succeeded but no scan ID was returned.');
        }

        // Stage 2: Start scanning pipeline with animation
        const scanPromise = safeFetch<any>(`/api/scan/${scanId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        await Promise.all([scanPromise, runPipelineAnimation()]);
        await scanPromise;
      } else if (scanMode === 'url') {
        if (!repoUrl.trim()) {
          setScanError('Please enter a valid Git repository URL.');
          setIsScanning(false);
          return;
        }

        const urlPromise = safeFetch<any>('/api/scan/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: repoUrl.trim() }),
        });

        await Promise.all([urlPromise, runPipelineAnimation()]);
        await urlPromise;
      } else if (scanMode === 'snippet') {
        if (!snippetText.trim()) {
          setScanError('Please paste git log or source code diff.');
          setIsScanning(false);
          return;
        }

        const snippetPromise = safeFetch<any>('/api/scan/snippet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: snippetText,
            repoName: snippetRepoName || 'pasted-diff',
          }),
        });

        await Promise.all([snippetPromise, runPipelineAnimation()]);
        await snippetPromise;
      }

      onScanComplete();
    } catch (err: any) {
      console.error('Scan execution error:', err);
      setScanError(err.message || 'Scan error occurred. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Scan Git Repository
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Full Git Object History
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Analyze commits, branches, and working trees for leaked secrets, tokens, and private keys.
              </p>
            </div>
          </div>
        </div>

        {/* Demo button */}
        <button
          onClick={onLoadDemo}
          disabled={isLoadingDemo || isScanning}
          className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
          <span>{isLoadingDemo ? 'Loading Demo...' : 'Load Demo Repository'}</span>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setScanMode('zip')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                scanMode === 'zip'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Upload Repository ZIP</span>
            </button>

            <button
              onClick={() => setScanMode('url')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                scanMode === 'url'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Git Repository URL</span>
            </button>

            <button
              onClick={() => setScanMode('snippet')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                scanMode === 'snippet'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Git Diff / Log</span>
            </button>
          </div>
        </div>

        {/* Option 1: ZIP Upload Dropzone */}
        {scanMode === 'zip' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-sky-400 bg-sky-50/50'
                  : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3">
                <FolderArchive className="w-6 h-6" />
              </div>

              {selectedFile ? (
                <div>
                  <div className="text-sm font-bold text-slate-900">{selectedFile.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to scan
                  </div>
                  <span className="inline-block mt-2 text-xs font-bold text-sky-600 hover:underline">
                    Click to choose a different ZIP
                  </span>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Drag and drop your Git repository <span className="text-sky-600">.ZIP</span> here
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Include the hidden <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.git</code> folder for full commit history audit
                  </p>
                  <button
                    type="button"
                    className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Option 2: Git URL */}
        {scanMode === 'url' && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Git Repository Clone URL (GitHub / GitLab / Bitbucket)
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/organization/production-service.git"
              className="w-full bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              For public repositories or standard test fixtures.
            </p>
          </div>
        )}

        {/* Option 3: Snippet Diff */}
        {scanMode === 'snippet' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Repository Identifier / Tag
              </label>
              <input
                type="text"
                value={snippetRepoName}
                onChange={(e) => setSnippetRepoName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Paste Source Code, Git Log, or Commit Diff
              </label>
              <textarea
                value={snippetText}
                onChange={(e) => setSnippetText(e.target.value)}
                rows={7}
                placeholder="commit 9d42f1a8e&#10;Author: dev@company.com&#10;Date: 2026-03-01&#10;&#10;+ const AWS_SECRET = 'AKIAIOSFODNN7EXAMPLE';"
                className="w-full bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        )}

        {/* Error message if any */}
        {scanError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Progress bar during scan */}
        {isScanning && (
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                {stages[scanProgressStage]}
              </span>
              <span>{Math.round(((scanProgressStage + 1) / stages.length) * 100)}%</span>
            </div>
            <div className="w-full bg-sky-200 rounded-full h-2">
              <div
                className="bg-sky-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((scanProgressStage + 1) / stages.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Start Scan CTA Button */}
        <div className="pt-2">
          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Pipeline Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run CredSense Security Scan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
