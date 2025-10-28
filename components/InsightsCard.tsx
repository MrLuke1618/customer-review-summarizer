import React from 'react';
import { Insight } from '../types';

interface InsightsCardProps {
  insights: Insight[];
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({ insights, icon, iconBgColor, iconTextColor }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-full ${iconBgColor}`}>
            <div className={`h-6 w-6 ${iconTextColor}`}>
              {icon}
            </div>
          </div>
          <h3 className="ml-4 text-xl font-semibold text-slate-800 dark:text-slate-100">Actionable Insights</h3>
        </div>
        <div className="mt-4 space-y-4">
          {insights && insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  <span className="text-rose-500 font-bold">Cause: </span>{insight.cause}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-500 font-bold">Suggestion: </span>{insight.suggestion}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 italic">No specific insights generated.</p>
          )}
        </div>
      </div>
    </div>
  );
};
