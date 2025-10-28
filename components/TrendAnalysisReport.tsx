import React from 'react';
import { TrendAnalysis, Summary } from '../types';
import { TrendChart } from './TrendChart';
import { ArrowTrendingLinesIcon, ThumbsUpIcon, ThumbsDownIcon, LightBulbIcon } from './Icons';

interface TrendAnalysisReportProps {
  analysis: TrendAnalysis;
  trendChartData: { label: string; summary: Summary }[];
  startReportLabel: string;
  endReportLabel: string;
  onClose: () => void;
}

const TrendInfoCard: React.FC<{ title: string; items: string[]; icon: React.ReactNode; bgColor: string; textColor: string; }> = ({ title, items, icon, bgColor, textColor }) => (
    <div className={`p-4 rounded-lg ${bgColor}`}>
        <div className="flex items-center mb-3">
            <div className={`flex-shrink-0 w-7 h-7 ${textColor}`}>{icon}</div>
            <h4 className={`ml-2 text-md font-semibold ${textColor}`}>{title}</h4>
        </div>
        {items.length > 0 ? (
            <ul className="space-y-1 text-sm list-disc list-inside">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        ) : (
            <p className="text-sm italic">None identified.</p>
        )}
    </div>
);


export const TrendAnalysisReport: React.FC<TrendAnalysisReportProps> = ({ analysis, trendChartData, startReportLabel, endReportLabel, onClose }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800">
        <div className="p-6">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-full bg-purple-100 dark:bg-purple-900/50">
                        <div className="h-6 w-6 text-purple-500 dark:text-purple-400">
                            <ArrowTrendingLinesIcon />
                        </div>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">AI Trend Analysis Report</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Comparing '{startReportLabel}' vs. '{endReportLabel}'</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                    Back to Reports
                </button>
            </div>

            <div className="space-y-8">
                <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Narrative Summary</h4>
                    <p className="mt-2 p-4 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-200 dark:border-slate-700">
                        {analysis.summary}
                    </p>
                </div>

                <TrendChart data={trendChartData} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TrendInfoCard 
                        title="New Issues"
                        items={analysis.newIssues}
                        icon={<ThumbsDownIcon />}
                        bgColor="bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200"
                        textColor="text-rose-600 dark:text-rose-400"
                    />
                     <TrendInfoCard 
                        title="Resolved Issues"
                        items={analysis.resolvedIssues}
                        icon={<ThumbsUpIcon />}
                        bgColor="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
                        textColor="text-emerald-600 dark:text-emerald-400"
                    />
                     <TrendInfoCard 
                        title="Persistent Themes"
                        items={analysis.persistentThemes}
                        icon={<LightBulbIcon />}
                        bgColor="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                        textColor="text-amber-600 dark:text-amber-400"
                    />
                </div>
            </div>
        </div>
    </div>
  );
};