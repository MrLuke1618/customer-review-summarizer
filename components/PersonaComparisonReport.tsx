import React from 'react';
import { PersonaComparison } from '../types';
import { UsersIcon, LightBulbIcon } from './Icons';

interface PersonaComparisonReportProps {
  comparison: PersonaComparison;
}

export const PersonaComparisonReport: React.FC<PersonaComparisonReportProps> = ({ comparison }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 p-3 rounded-full bg-purple-100 dark:bg-purple-900/50">
            <div className="h-6 w-6 text-purple-500 dark:text-purple-400">
              <UsersIcon />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Persona Comparison Overview</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Key differences in feedback across customer segments.</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Overview</h4>
            <p className="mt-2 p-4 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-200 dark:border-slate-700">
              {comparison.overview}
            </p>
          </div>

          <div>
             <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Key Differentiators by Segment</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparison.segmentComparisons.map((seg, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-500 dark:text-purple-400">{seg.segment}</h5>
                        {seg.keyDifferentiators.length > 0 ? (
                            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                {seg.keyDifferentiators.map((diff, i) => (
                                    <li key={i} className="flex items-start">
                                        <LightBulbIcon className="flex-shrink-0 w-4 h-4 text-amber-500 mr-2.5 mt-0.5" />
                                        <span>{diff}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="mt-2 text-sm italic text-slate-500">No strong differentiators identified.</p>
                        )}
                    </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};