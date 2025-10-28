import React from 'react';
import { Keyword } from '../types';

interface KeywordsCardProps {
  keywords: Keyword[];
  onKeywordClick: (keyword: string) => void;
}

export const KeywordsCard: React.FC<KeywordsCardProps> = ({ keywords, onKeywordClick }) => {
  if (!keywords || keywords.length === 0) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
                 <div className="flex items-center">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Top Keywords</h3>
                </div>
                <p className="mt-4 text-sm text-slate-500 italic">No specific keywords were extracted.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Top Keywords</h3>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {keywords.map((item) => (
            <button
              key={item.keyword}
              onClick={() => onKeywordClick(item.keyword)}
              className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-purple-100 dark:hover:bg-purple-800/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
              title={`Analyze mentions of "${item.keyword}"`}
            >
              <span>{item.keyword}</span>
              <span className="ml-2 text-xs font-semibold bg-white dark:bg-slate-600 text-slate-500 dark:text-slate-300 rounded-full px-2 py-0.5">
                {item.frequency}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};