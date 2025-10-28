import React, { useState } from 'react';
import { SparklesIcon } from './Icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
  const [key, setKey] = useState('');

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-modal-title"
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col"
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-purple-500" />
            <h2 id="api-key-modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Enter Your API Key
            </h2>
          </div>
        </header>
        
        <main className="p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
                An AI-powered action requires a Google AI Studio API key to proceed. Your key is saved securely in your browser's local storage and is not shared.
            </p>
            <div>
                <label htmlFor="api-key-input" className="sr-only">Google AI Studio API Key</label>
                <input
                    id="api-key-input"
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter your API key here"
                    className="flex-1 block w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition sm:text-sm"
                />
                 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-purple-500 dark:text-purple-400 hover:underline">
                    Get your API key from Google AI Studio
                </a>
            </div>
        </main>
        
        <footer className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400"
            >
              Save and Continue
            </button>
        </footer>
      </div>
    </div>
  );
};
