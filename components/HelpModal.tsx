import React from 'react';
import { CloseIcon, SparklesIcon, InfoIcon, TargetIcon, LightBulbIcon, PasteIcon, FileIcon, SheetIcon, WrenchIcon, BarChartIcon, ReplyIcon, ChatBubbleIcon, CheckIcon, UsersIcon, YouTubeIcon } from './Icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-slate-100 dark:bg-slate-700/50 p-5 rounded-xl">
        <div className="flex items-center mb-3">
            <div className="flex-shrink-0 h-8 w-8 text-purple-500 dark:text-purple-400 p-1 bg-white dark:bg-slate-800 rounded-lg shadow">
                {icon}
            </div>
            <h3 className="ml-4 text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
        <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm pl-1">
            {children}
        </div>
    </div>
);

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-purple-500 text-white font-bold rounded-full mr-4 mt-1">
            {number}
        </div>
        <div className="flex-1">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
            <div className="mt-1 text-slate-600 dark:text-slate-300 space-y-2">{children}</div>
        </div>
    </div>
);

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-start">
        <CheckIcon className="flex-shrink-0 w-5 h-5 text-emerald-500 mr-3 mt-0.5" />
        <p>{children}</p>
    </div>
);

const CodeBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <code className="px-1.5 py-0.5 text-xs font-mono bg-slate-200 dark:bg-slate-600 text-purple-600 dark:text-purple-300 rounded">{children}</code>
);

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-purple-500" />
            <h2 id="help-modal-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100">How to Use Customer Insights AI</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close help modal">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
          <HelpCard icon={<InfoIcon className="w-full h-full" />} title="What is this app?">
            <p>
              Customer Insights AI is a powerful tool designed to help customer service teams quickly understand large volumes of customer feedback. It uses generative AI to analyze raw review data and transform it into an easy-to-digest summary, highlighting key trends, sentiments, and actionable insights.
            </p>
          </HelpCard>

          <HelpCard icon={<TargetIcon className="w-full h-full" />} title="How to Use It: A Step-by-Step Guide">
            <div className="space-y-6">
                <Step number={1} title="Provide Your Data">
                    <p>You have several options for inputting customer feedback:</p>
                    <div className="space-y-3 pl-2">
                        <div className="flex items-start">
                            <PasteIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-semibold">Paste Text:</strong>
                                <span className="ml-1.5">Directly paste raw text.</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <FileIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-semibold">Upload File(s):</strong>
                                <span className="ml-1.5">Upload up to 5 files (<CodeBadge>CSV</CodeBadge>, <CodeBadge>TXT</CodeBadge>, <CodeBadge>XLSX</CodeBadge>). For Persona Analysis, a single structured CSV is required.</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <SheetIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-semibold">Google Sheet:</strong>
                                <span className="ml-1.5">Paste a public Google Sheet URL.</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <YouTubeIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-semibold">YouTube Comments:</strong>
                                <span className="ml-1.5">Export comments using a third-party tool, then use the "Paste Text" or "Upload File(s)" tabs to analyze them.</span>
                            </div>
                        </div>
                    </div>
                </Step>
                <Step number={2} title="Configure Your Analysis">
                    <p>
                        Set the <strong className="font-semibold">Analysis Language</strong> for the output report. For advanced analysis, you can also specify a <strong className="font-semibold">Persona/Segment Column Name</strong>.
                    </p>
                     <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm">
                        <p><strong className="font-semibold text-purple-700 dark:text-purple-300">Persona Analysis Tip:</strong> To compare feedback across different customer types (e.g., 'New User' vs 'Power User'), ensure your data is a single CSV with a dedicated column for the persona. Then, enter that column's exact name into the optional input field.</p>
                    </div>
                </Step>
                <Step number={3} title="Generate Insights">
                    <p>Click the <span className="font-semibold text-purple-500 dark:text-purple-400">Analyze</span> button. The AI will process all the data you've provided.</p>
                </Step>
                <Step number={4} title="Interpret the Results">
                     <p>The analysis is broken down into several cards for easy digestion:</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="flex items-center"><UsersIcon className="w-5 h-5 mr-2 text-purple-500" /> Persona Comparison</div>
                        <div className="flex items-center"><TargetIcon className="w-5 h-5 mr-2 text-purple-500" /> AI Strategic Analysis</div>
                        <div className="flex items-center"><BarChartIcon className="w-5 h-5 mr-2 text-purple-500" /> Analytics Dashboard</div>
                        <div className="flex items-center"><WrenchIcon className="w-5 h-5 mr-2 text-purple-500" /> Actionable Insights</div>
                    </div>
                </Step>
                 <Step number={5} title="Interact Further">
                    <p>Use the app's interactive features to dig deeper:</p>
                     <div className="space-y-3 pl-2">
                        <div className="flex items-start">
                            <ReplyIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-semibold">Draft Reply:</strong>
                                <span className="ml-1.5">Get an AI-generated response for any specific "Con".</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <ChatBubbleIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-semibold">Ask AI:</strong>
                                <span className="ml-1.5">Open the chatbot to ask questions about your data.</span>
                            </div>
                        </div>
                    </div>
                </Step>
            </div>
          </HelpCard>

           <HelpCard icon={<LightBulbIcon className="w-full h-full" />} title="Tips for Best Results">
            <div className="space-y-3">
                <Tip><strong>Quality In, Quality Out:</strong> The cleaner and more relevant your input data, the better the analysis will be.</Tip>
                <Tip><strong>Use Structured Data for Personas:</strong> For the best Persona Analysis, use a clean CSV file with consistent naming in your segment column.</Tip>
                <Tip><strong>Context is Key:</strong> The more context you provide about your product, the smarter the AI's suggestions and replies will be.</Tip>
                <Tip><strong>Export and Share:</strong> Use the "Export Report" button to generate a PDF, DOCX, or TXT file of the analysis for sharing.</Tip>
            </div>
          </HelpCard>
        </main>
      </div>
    </div>
  );
};