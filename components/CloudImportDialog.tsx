import React, { useState } from 'react';
import { Cloud, Link as LinkIcon, Download, Loader2, HardDrive } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string, type: 'url' | 'drive') => Promise<void>;
}

const CloudImportDialog: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'drive'>('url');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    try {
      await onImport(url, activeTab);
      onClose();
      setUrl('');
    } catch (error) {
      console.error(error);
      // In a real app, show error state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Cloud className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Import from Cloud</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-slate-200 flex">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'url' ? 'border-brand-600 text-brand-600 bg-brand-50' : 'border-transparent text-slate-500 hover:bg-slate-50'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Direct Link</span>
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'drive' ? 'border-brand-600 text-brand-600 bg-brand-50' : 'border-transparent text-slate-500 hover:bg-slate-50'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive</span>
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'url' ? (
             <form onSubmit={handleSubmit} className="space-y-4">
               <p className="text-sm text-slate-600">
                 Paste a direct link to a PDF or Image file. We will attempt to fetch and process it immediately.
               </p>
               <div>
                 <input 
                   type="url" 
                   value={url}
                   onChange={(e) => setUrl(e.target.value)}
                   placeholder="https://example.com/documents/contract.pdf"
                   className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                   required
                 />
               </div>
               <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                 Note: Ensure the URL is publicly accessible or allows CORS.
               </div>
               <button
                 type="submit"
                 disabled={isLoading}
                 className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
               >
                 {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                 <span>{isLoading ? 'Fetching Document...' : 'Import & Process'}</span>
               </button>
             </form>
          ) : (
             <div className="space-y-6 text-center py-4">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-8 h-8" />
               </div>
               <div>
                  <h3 className="text-slate-900 font-medium">Connect Google Drive</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Access your case files directly from your cloud storage.
                  </p>
               </div>
               
               {/* Simulation of Drive Picker */}
               <div className="border border-slate-200 rounded-lg p-4 text-left space-y-2 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Recent Files</div>
                  <div 
                    onClick={() => setUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')}
                    className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                  >
                     <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-red-600 font-bold text-xs">PDF</div>
                     <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">Client_Agreement_v2.pdf</div>
                        <div className="text-xs text-slate-400">Modified today</div>
                     </div>
                  </div>
                  <div 
                     onClick={() => setUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')}
                     className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                  >
                     <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-xs">IMG</div>
                     <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">Evidence_Photo_004.jpg</div>
                        <div className="text-xs text-slate-400">Modified yesterday</div>
                     </div>
                  </div>
               </div>

               <button
                 onClick={(e) => handleSubmit(e as any)}
                 disabled={!url || isLoading}
                 className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                 <span>Import Selected File</span>
               </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Quick helper icon import within component for the mock button
import { Check } from 'lucide-react';

export default CloudImportDialog;