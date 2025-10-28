import React from 'react';
import { DeepDiveAnalysis } from '../types';
import { CloseIcon, SearchIcon, ThumbsUpIcon, ThumbsDownIcon } from './Icons';

interface DeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string | null;
  analysis: DeepDiveAnalysis | null;
  isLoading: boolean;
}

const Stat: React.FC<{ icon: React.ReactNode; value: number; color: string; }> = ({ icon, value, color }) => (
    <div className="flex items-center space-x-2">
        <div className={`flex-shrink-0 w-6 h-6 p-1 rounded-full ${color}`}>
            {icon}
        </div>
        <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{value}</span>
    </div>
);

export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({ isOpen, onClose, topic, analysis, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="deep-dive-modal-title"
        className="w-full max-w-2xl h-[85vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <SearchIcon className="w-6 h-6 text-purple-500 flex-shrink-0" />
            <div>
              <h2 id="deep-dive-modal-title" className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Deep Dive Analysis
              </h2>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate" title={topic || ''}>
                {topic}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close deep dive modal">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="animate-spin h-10 w-10 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Analyzing "{topic}"...</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Searching for relevant feedback.</p>
            </div>
          )}

          {!isLoading && analysis && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">AI Summary</h3>
                <p className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {analysis.summary}
                </p>
              </div>
              
              <div className="flex items-center justify-around p-3 bg-slate-100 dark:bg-slate-700/40 rounded-lg">
                  <Stat icon={<ThumbsUpIcon />} value={analysis.sentiment.positive} color="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300" />
                  <Stat icon={<ThumbsDownIcon />} value={analysis.sentiment.negative} color="bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300" />
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 p-1 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z" /></svg>
                    </div>
                    <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{analysis.sentiment.neutral}</span>
                  </div>
              </div>

              <div>
                 <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Relevant Snippets ({analysis.snippets.length})</h3>
                 {analysis.snippets.length > 0 ? (
                    <div className="space-y-3">
                        {analysis.snippets.map((snippet, index) => (
                            <blockquote key={index} className="p-3 border-l-4 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 rounded-r-lg">
                                <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{snippet}"</p>
                            </blockquote>
                        ))}
                    </div>
                 ) : (
                    <p className="text-sm text-slate-500 italic">No specific snippets found for this topic.</p>
                 )}
              </div>
            </div>
          )}

           {!isLoading && !analysis && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">Analysis Failed</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Could not retrieve details for "{topic}". Please try again.</p>
              </div>
           )}

        </main>
      </div>
    </div>
  );
};