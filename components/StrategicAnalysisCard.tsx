import React from 'react';
import { StrategicAnalysis } from '../types';

interface StrategicAnalysisCardProps {
  analysis: StrategicAnalysis;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
}

export const StrategicAnalysisCard: React.FC<StrategicAnalysisCardProps> = ({ analysis, icon, iconBgColor, iconTextColor }) => {
  if (!analysis) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-purple-200 dark:border-purple-800">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-full ${iconBgColor}`}>
            <div className={`h-6 w-6 ${iconTextColor}`}>
              {icon}
            </div>
          </div>
          <h3 className="ml-4 text-xl font-semibold text-slate-800 dark:text-slate-100">AI Strategic Analysis</h3>
        </div>
        
        <div className="mt-5 space-y-6">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Overview</h4>
            <p className="mt-1 text-slate-700 dark:text-slate-300">{analysis.overview}</p>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Key Focus Area</h4>
            <p className="mt-1 text-lg font-semibold text-purple-500 dark:text-purple-400">{analysis.keyFocusArea}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Recommended Next Steps</h4>
            <div className="space-y-4">
              {analysis.steps.map((item, index) => (
                <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{index + 1}. {item.step}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Rationale: </span>{item.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};