import React from 'react';
import { DocumentAsset } from '../types';

interface Props {
  document: DocumentAsset | null;
}

const DocumentViewer: React.FC<Props> = ({ document }) => {
  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl m-4">
        <p className="text-slate-400 font-medium">Select a document</p>
        <p className="text-slate-300 text-xs mt-1">Preview will appear here</p>
      </div>
    );
  }

  const isImage = document.type.startsWith('image/');

  return (
    <div className="h-full flex flex-col bg-slate-800 rounded-xl overflow-hidden shadow-inner w-full">
      <div className="h-10 bg-slate-900 flex items-center px-4 flex-shrink-0">
         <span className="text-xs font-mono text-slate-300 truncate max-w-full">{document.name}</span>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-800/50 p-4 relative min-h-0">
        {isImage ? (
          <img 
            src={document.url} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain shadow-lg rounded-sm" 
          />
        ) : (
          <iframe
            src={document.url}
            className="w-full h-full bg-white rounded-sm shadow-lg min-w-0"
            title="PDF Preview"
          />
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;