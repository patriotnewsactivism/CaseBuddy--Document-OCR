import React, { useState } from 'react';
import { IntegrationConfig } from '../types';
import { Settings, Cloud, Database, Save, CheckCircle2 } from 'lucide-react';

interface Props {
  config: IntegrationConfig;
  onUpdate: (config: IntegrationConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

const IntegrationSettings: React.FC<Props> = ({ config, onUpdate, isOpen, onClose }) => {
  const [localConfig, setLocalConfig] = useState<IntegrationConfig>(config);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate(localConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Settings className="w-5 h-5" />
            <h2 className="font-semibold text-lg">System Integration</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Database className="w-4 h-4 text-brand-600" />
                <span>CaseBuddy API Endpoint</span>
              </label>
              <input 
                type="text" 
                value={localConfig.caseBuddyEndpoint}
                onChange={(e) => setLocalConfig({...localConfig, caseBuddyEndpoint: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm font-mono text-slate-600"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Cloud className="w-4 h-4 text-brand-600" />
                <span>Cloud Storage Bucket URL (S3/GCS)</span>
              </label>
              <input 
                type="text" 
                value={localConfig.cloudBucketUrl}
                onChange={(e) => setLocalConfig({...localConfig, cloudBucketUrl: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm font-mono text-slate-600"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input 
                type="checkbox"
                id="autosync"
                checked={localConfig.autoSync}
                onChange={(e) => setLocalConfig({...localConfig, autoSync: e.target.checked})}
                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
              />
              <label htmlFor="autosync" className="text-sm text-slate-700">
                Automatically push processed data to CaseBuddy
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                saved 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/30'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configuration Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSettings;
