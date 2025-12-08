import React, { useState } from 'react';
import { DocumentAsset, ProcessingStatus, IntegrationConfig } from '../types';
// Added FileText and Loader2 to imports
import { UploadCloud, Copy, Check, FileJson, BrainCircuit, RefreshCw, FileText, Loader2 } from 'lucide-react';

interface Props {
  document: DocumentAsset | null;
  config: IntegrationConfig;
  onRetry: () => void;
}

const ExtractionPanel: React.FC<Props> = ({ document, config, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [synced, setSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleCopy = () => {
    if (document?.extractedData) {
      navigator.clipboard.writeText(document.extractedData.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`[CaseBuddy Sync] POST ${config.caseBuddyEndpoint}`, document?.extractedData);
    console.log(`[Cloud Bucket] UPLOAD ${config.cloudBucketUrl}/${document?.name}`);
    setIsSyncing(false);
    setSynced(true);
    setTimeout(() => setSynced(false), 3000);
  };

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
        <BrainCircuit className="w-12 h-12 mb-4 text-slate-200" />
        <h3 className="text-lg font-medium text-slate-600">Waiting for Content</h3>
        <p className="text-sm mt-2">Select or upload a document to begin intelligent extraction.</p>
      </div>
    );
  }

  if (document.status === ProcessingStatus.PROCESSING) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-brand-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-brand-600 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-800">Analyzing Document</h3>
          <p className="text-sm text-slate-500 mt-2">Extracting text, identifying entities, and structuring data...</p>
        </div>
      </div>
    );
  }

  if (document.status === ProcessingStatus.ERROR || !document.extractedData) {
     return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <RefreshCw className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-800">Extraction Failed</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6 max-w-xs">{document.errorMessage || "An unknown error occurred."}</p>
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors"
        >
          Retry Extraction
        </button>
      </div>
    );
  }

  const { extractedData } = document;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${extractedData.confidenceScore > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Confidence: {extractedData.confidenceScore}%
          </span>
        </div>
        <div className="flex space-x-2">
           <button 
            onClick={handleCopy}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
            title="Copy Raw Text"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        
        {/* Entities Section (High Value) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Identified Persons/Orgs</h4>
              <div className="flex flex-wrap gap-2">
                {extractedData.entities.names.length > 0 ? extractedData.entities.names.map((name, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {name}
                  </span>
                )) : <span className="text-xs text-slate-400 italic">None detected</span>}
              </div>
           </div>
           
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Case References</h4>
               <div className="flex flex-wrap gap-2">
                {extractedData.entities.caseNumbers.length > 0 ? extractedData.entities.caseNumbers.map((num, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {num}
                  </span>
                )) : <span className="text-xs text-slate-400 italic">None detected</span>}
              </div>
           </div>
        </div>

        {/* Summary */}
        <div>
           <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
             <BrainCircuit className="w-4 h-4 mr-2 text-brand-500" />
             AI Summary
           </h4>
           <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
             {extractedData.summary}
           </p>
        </div>

        {/* Raw Text */}
        <div>
           <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
             <FileText className="w-4 h-4 mr-2 text-brand-500" />
             Extracted Content
           </h4>
           <div className="text-sm font-mono text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100 h-64 overflow-y-auto custom-scrollbar leading-relaxed">
             {extractedData.rawText}
           </div>
        </div>
      </div>

      {/* Footer / Sync Action */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={handleManualSync}
          disabled={isSyncing || synced}
          className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-all transform ${
            synced 
              ? 'bg-green-600 text-white'
              : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 hover:scale-[1.01] active:scale-[0.99]'
          } ${isSyncing ? 'opacity-75 cursor-wait' : ''}`}
        >
          {isSyncing ? (
             <Loader2 className="w-5 h-5 animate-spin" />
          ) : synced ? (
             <Check className="w-5 h-5" />
          ) : (
             <UploadCloud className="w-5 h-5" />
          )}
          <span>
            {isSyncing ? 'Pushing to CaseBuddy...' : synced ? 'Synced Successfully' : 'Push to CaseBuddy Cloud'}
          </span>
        </button>
        <div className="mt-2 flex justify-between text-[10px] text-slate-400 px-1">
          <span>Target: {new URL(config.caseBuddyEndpoint).hostname}</span>
          <span className="flex items-center"><FileJson className="w-3 h-3 mr-1"/> JSON Payload Ready</span>
        </div>
      </div>
    </div>
  );
};

export default ExtractionPanel;