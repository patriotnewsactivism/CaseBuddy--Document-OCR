import React from 'react';
import { DocumentAsset, ProcessingStatus, SourceType } from '../types';
import { FileText, Loader2, CheckCircle, AlertCircle, Plus, Image as ImageIcon, FolderInput, Cloud, Link as LinkIcon } from 'lucide-react';

interface Props {
  documents: DocumentAsset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUploadClick: () => void;
  onFolderUploadClick: () => void;
  onCloudClick: () => void;
  className?: string; // Allow external styling (hiding on mobile)
}

const DocumentList: React.FC<Props> = ({ 
  documents, 
  selectedId, 
  onSelect, 
  onUploadClick, 
  onFolderUploadClick,
  onCloudClick,
  className = ""
}) => {
  return (
    <div className={`w-full md:w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-slate-200 bg-white space-y-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingestion</h2>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onUploadClick}
            className="flex items-center justify-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>File</span>
          </button>
          <button 
            onClick={onFolderUploadClick}
            className="flex items-center justify-center space-x-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            <FolderInput className="w-3 h-3" />
            <span>Folder</span>
          </button>
        </div>
        <button 
          onClick={onCloudClick}
          className="w-full flex items-center justify-center space-x-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 py-2 rounded-lg text-xs font-medium transition-all"
        >
          <Cloud className="w-3 h-3" />
          <span>Import from Cloud / URL</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {documents.length === 0 && (
          <div className="text-center py-12 px-4 flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
               <FileText className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No documents</p>
            <p className="text-xs text-slate-400 mt-1">Upload files, folders, or link a drive to begin extraction.</p>
          </div>
        )}
        
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-colors text-left group relative overflow-hidden ${
              selectedId === doc.id 
                ? 'bg-white shadow-md border border-slate-100 ring-1 ring-slate-100' 
                : 'hover:bg-slate-100 border border-transparent'
            }`}
          >
            {/* Status Indicator Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
               doc.status === ProcessingStatus.COMPLETED ? 'bg-green-500' :
               doc.status === ProcessingStatus.ERROR ? 'bg-red-500' :
               doc.status === ProcessingStatus.PROCESSING ? 'bg-brand-500' : 'bg-slate-300'
            }`} />

            <div className="mt-1 pl-2">
              {doc.type.includes('image') ? (
                 <ImageIcon className={`w-4 h-4 ${selectedId === doc.id ? 'text-brand-600' : 'text-slate-400'}`} />
              ) : (
                 <FileText className={`w-4 h-4 ${selectedId === doc.id ? 'text-brand-600' : 'text-slate-400'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${selectedId === doc.id ? 'text-slate-900' : 'text-slate-700'}`}>
                {doc.name}
              </p>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-2">
                   {doc.source === SourceType.FOLDER && <FolderInput className="w-3 h-3 text-slate-400" />}
                   {doc.source === SourceType.CLOUD && <Cloud className="w-3 h-3 text-slate-400" />}
                   <span className="text-[10px] text-slate-400">{(doc.size / 1024).toFixed(0)}KB</span>
                </div>
                
                {doc.status === ProcessingStatus.PROCESSING && (
                   <Loader2 className="w-3 h-3 text-brand-600 animate-spin" />
                )}
                {doc.status === ProcessingStatus.COMPLETED && (
                   <CheckCircle className="w-3 h-3 text-green-600" />
                )}
                {doc.status === ProcessingStatus.ERROR && (
                   <AlertCircle className="w-3 h-3 text-red-500" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="p-3 border-t border-slate-200 bg-white text-[10px] text-slate-400 text-center flex flex-col">
        <span>Powered by Tesseract.js</span>
      </div>
    </div>
  );
};

export default DocumentList;