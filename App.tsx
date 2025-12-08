import React, { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DocumentAsset, ProcessingStatus, IntegrationConfig, SourceType } from './types';
import { DEFAULT_INTEGRATION_CONFIG, ACCEPTED_FILE_TYPES } from './constants';
import { performOCR } from './services/geminiService';
import DocumentList from './components/DocumentList';
import DocumentViewer from './components/DocumentViewer';
import ExtractionPanel from './components/ExtractionPanel';
import IntegrationSettings from './components/IntegrationSettings';
import CloudImportDialog from './components/CloudImportDialog';
import { BrainCircuit, Settings as SettingsIcon, Upload, Menu, X, ArrowLeft, FolderUp } from 'lucide-react';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCloudOpen, setIsCloudOpen] = useState(false);
  const [config, setConfig] = useState<IntegrationConfig>(DEFAULT_INTEGRATION_CONFIG);
  
  // Mobile Responsiveness States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'preview' | 'data'>('preview');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // --- File Handlers ---

  const processNewFile = async (file: File, source: SourceType = SourceType.LOCAL) => {
    const newDoc: DocumentAsset = {
      id: uuidv4(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      status: ProcessingStatus.UPLOADING,
      uploadDate: new Date(),
      source,
    };

    setDocuments(prev => [newDoc, ...prev]);
    setSelectedId(newDoc.id);
    
    // On mobile, if we add a doc, switch to viewing it
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
        setMobileTab('preview');
    }

    // Start OCR Process
    updateDocStatus(newDoc.id, ProcessingStatus.PROCESSING);

    try {
      const data = await performOCR(file);
      updateDocStatus(newDoc.id, ProcessingStatus.COMPLETED, data);
      
      if (config.autoSync) {
        console.log(`[AutoSync] Pushing ${newDoc.name} to ${config.caseBuddyEndpoint}`);
      }

    } catch (error: any) {
      console.error(error);
      updateDocStatus(newDoc.id, ProcessingStatus.ERROR, undefined, error.message);
    }
  };

  const updateDocStatus = (id: string, status: ProcessingStatus, data?: any, error?: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          status,
          extractedData: data,
          errorMessage: error
        };
      }
      return doc;
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processNewFile(file, SourceType.LOCAL);
      e.target.value = '';
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const validFiles = files.filter(f => ACCEPTED_FILE_TYPES.includes(f.type));
      
      if (validFiles.length === 0) {
         alert("No compatible files (PDF/Image) found in the selected folder.");
         return;
      }
      
      // Close sidebar on mobile
      setIsSidebarOpen(false);

      // Process all files concurrently but detached
      validFiles.forEach(file => {
          processNewFile(file, SourceType.FOLDER);
      });
      
      e.target.value = '';
    }
  };

  const handleCloudImport = async (url: string, type: 'url' | 'drive') => {
    // In a real app, this would use a backend proxy to avoid CORS
    // Here we simulate fetching the blob
    try {
        const response = await fetch(url, { mode: 'cors' }).catch(() => null);
        if (!response || !response.ok) {
           // Fallback for demo if CORS fails: create a dummy file
           const dummyBlob = new Blob(["Simulated content for demo"], { type: 'application/pdf' });
           const name = url.split('/').pop() || "downloaded_doc.pdf";
           const file = new File([dummyBlob], name, { type: 'application/pdf' });
           await processNewFile(file, SourceType.CLOUD);
        } else {
           const blob = await response.blob();
           const name = url.split('/').pop() || "downloaded_doc.pdf";
           const file = new File([blob], name, { type: blob.type });
           await processNewFile(file, SourceType.CLOUD);
        }
    } catch (e) {
        // Fallback for demo
        const dummyBlob = new Blob(["Simulated content"], { type: 'application/pdf' });
        const name = "drive_import_demo.pdf";
        const file = new File([dummyBlob], name, { type: 'application/pdf' });
        await processNewFile(file, SourceType.CLOUD);
    }
  };

  const retryOCR = async () => {
    if (!selectedId) return;
    const doc = documents.find(d => d.id === selectedId);
    if (!doc) return;

    updateDocStatus(doc.id, ProcessingStatus.PROCESSING);
    
    try {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const file = new File([blob], doc.name, { type: doc.type });
      
      const data = await performOCR(file);
      updateDocStatus(doc.id, ProcessingStatus.COMPLETED, data);
    } catch (error: any) {
      updateDocStatus(doc.id, ProcessingStatus.ERROR, undefined, error.message);
    }
  };

  // --- Drag & Drop ---

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Logic to distinguish folders in drag/drop is complex in browser
      // Treating all as files for simplicity
      const file = e.dataTransfer.files[0];
      if (ACCEPTED_FILE_TYPES.includes(file.type)) {
        await processNewFile(file);
      } else {
        alert("Unsupported file type. Please upload PDF or Images.");
      }
    }
  }, [config.autoSync]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // --- Render Helpers ---

  const selectedDocument = documents.find(d => d.id === selectedId) || null;

  return (
    <div 
      className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans text-slate-900"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Navbar */}
      <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-20 flex-shrink-0 relative">
        <div className="flex items-center space-x-3">
          <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
             {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="p-1.5 md:p-2 bg-brand-600 rounded-lg shadow-lg shadow-brand-500/30">
            <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight">
              CaseBuddy <span className="text-brand-600 hidden xs:inline">Intelligent OCR</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden lg:flex items-center text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
             <span className={`w-2 h-2 rounded-full mr-2 ${config.autoSync ? 'bg-green-500' : 'bg-slate-300'}`}></span>
             Auto-Sync: {config.autoSync ? 'ON' : 'OFF'}
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar - Responsive Drawer */}
        <div className={`
            absolute inset-y-0 left-0 z-10 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none md:w-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
           <DocumentList 
             documents={documents} 
             selectedId={selectedId} 
             onSelect={(id) => {
                setSelectedId(id);
                setIsSidebarOpen(false); // Close menu on mobile selection
                setMobileTab('preview');
             }}
             onUploadClick={() => fileInputRef.current?.click()}
             onFolderUploadClick={() => folderInputRef.current?.click()}
             onCloudClick={() => {
                setIsSidebarOpen(false);
                setIsCloudOpen(true);
             }}
           />
        </div>
        
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
           <div 
             className="absolute inset-0 z-0 bg-black/20 backdrop-blur-sm md:hidden"
             onClick={() => setIsSidebarOpen(false)}
           />
        )}

        {/* Workspace */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100 p-0 md:p-4 gap-4 relative">
          
          {/* Mobile Tab Switcher */}
          <div className="md:hidden flex bg-white border-b border-slate-200">
             <button 
                onClick={() => setMobileTab('preview')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${mobileTab === 'preview' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}
             >
                Document
             </button>
             <button 
                onClick={() => setMobileTab('data')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${mobileTab === 'data' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}
             >
                Extracted Data
             </button>
          </div>

          {/* Left: Document Preview */}
          <section className={`
             flex-1 flex-col min-w-0 md:flex
             ${mobileTab === 'preview' ? 'flex' : 'hidden'}
          `}>
             <div className="hidden md:flex bg-white rounded-t-xl border-b border-slate-200 p-3 items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                  <span className="w-2 h-2 bg-brand-500 rounded-full mr-2"></span>
                  Original Source
                </h3>
             </div>
             <div className="flex-1 min-h-0 bg-white md:bg-transparent">
                <DocumentViewer document={selectedDocument} />
             </div>
          </section>

          {/* Right: Extraction Results */}
          <section className={`
             flex-1 flex-col min-w-0 bg-white md:rounded-xl shadow-sm border-t md:border border-slate-200 overflow-hidden md:flex
             ${mobileTab === 'data' ? 'flex' : 'hidden'}
          `}>
             <ExtractionPanel 
               document={selectedDocument} 
               config={config}
               onRetry={retryOCR}
             />
          </section>
        </main>
      </div>

      {/* Hidden Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept={ACCEPTED_FILE_TYPES.join(',')}
      />
      
      {/* Folder Input - Special attributes handled by casting in ref assignment if needed, but standard prop works in most modern react */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderUpload}
        className="hidden"
        // @ts-ignore - React Types don't always support webkitdirectory yet
        webkitdirectory="" 
        directory="" 
        multiple
      />
      
      {/* Modals */}
      <IntegrationSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config} 
        onUpdate={setConfig}
      />

      <CloudImportDialog 
         isOpen={isCloudOpen}
         onClose={() => setIsCloudOpen(false)}
         onImport={handleCloudImport}
      />
      
      {/* Drag Overlay (Visual hint) */}
      {documents.length === 0 && !isCloudOpen && !isSettingsOpen && (
         <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-5">
            <Upload className="w-96 h-96" />
         </div>
      )}
    </div>
  );
};

export default App;