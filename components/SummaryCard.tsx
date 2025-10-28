import React, { useState } from 'react';
import { generateDraftReply } from '../services/geminiService';
import { ReplyIcon, CopyIcon, CheckIcon } from './Icons';

interface SummaryCardProps {
  title: "Pros" | "Cons" | "Common Themes";
  items: string[];
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  language: string;
  context: string;
  apiKey: string;
  onItemClick?: (item: string) => void;
}

const ReplyGenerator: React.FC<{ complaint: string; language: string; context: string; apiKey: string }> = ({ complaint, language, context, apiKey }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [reply, setReply] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setReply(null);
        const result = await generateDraftReply(apiKey, complaint, language, context);
        setReply(result);
        setIsLoading(false);
    };

    const handleCopy = () => {
        if (!reply) return;
        navigator.clipboard.writeText(reply).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    if (reply) {
        return (
            <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{reply}</p>
                <div className="mt-2 flex justify-end">
                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center text-xs font-medium text-purple-500 dark:text-purple-400 hover:underline"
                    >
                        {isCopied ? <CheckIcon className="w-4 h-4 mr-1 text-emerald-500" /> : <CopyIcon className="w-4 h-4 mr-1" />}
                        {isCopied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-2 flex justify-end">
             <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400"
            >
                {isLoading ? (
                    <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <ReplyIcon className="w-4 h-4 mr-1" />
                )}
                {isLoading ? 'Drafting...' : 'Draft Reply'}
            </button>
        </div>
    );
};

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, items, icon, iconBgColor, iconTextColor, language, context, apiKey, onItemClick }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-full ${iconBgColor}`}>
              <div className={`h-6 w-6 ${iconTextColor}`}>
                {icon}
              </div>
            </div>
            <h3 className="ml-4 text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          </div>
          {items && <span className="text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-3 py-1">
            {items.length}
          </span>}
        </div>
        <div className="mt-4 text-slate-600 dark:text-slate-300">
          {items && items.length > 0 ? (
            <ul className="space-y-1">
              {items.map((item, index) => (
                <li key={index}>
                  {title === 'Common Themes' && onItemClick ? (
                    <button
                      onClick={() => onItemClick(item)}
                      className="w-full text-left p-2 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <div className="flex items-start">
                        <svg className="flex-shrink-0 h-5 w-5 text-purple-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{item}</span>
                      </div>
                    </button>
                  ) : (
                    <div className="p-2 rounded-md">
                      <div className="flex items-start">
                        <svg className="flex-shrink-0 h-5 w-5 text-purple-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{item}</span>
                      </div>
                      {title === 'Cons' && <ReplyGenerator complaint={item} language={language} context={context} apiKey={apiKey} />}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">No items found.</p>
          )}
        </div>
      </div>
    </div>
  );
};