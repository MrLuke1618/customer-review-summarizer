import React, { useRef, useState, useEffect } from 'react';
import { Summary } from '../types';
import { TrendingUpIcon, TrendingDownIcon, HashtagIcon } from './Icons';

interface DashboardMetricsProps {
  summary: Summary;
  isCompact?: boolean;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; iconColor: string; allowWrap?: boolean; }> = ({ icon, label, value, iconColor, allowWrap = false }) => {
    return (
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-center space-x-3">
            <div className={`flex-shrink-0 p-2 rounded-full ${iconColor}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider truncate" title={label}>{label}</p>
                <p className={`text-lg font-bold text-slate-800 dark:text-slate-100 ${allowWrap ? '' : 'truncate'}`} title={typeof value === 'string' ? value : undefined}>{value}</p>
            </div>
        </div>
    );
};

const DonutChart: React.FC<{ data: { positive: number; negative: number; neutral: number; } }> = ({ data }) => {
    const { positive, negative, neutral } = data;
    const total = positive + negative + neutral;
    if (total === 0) {
        return <div className="flex items-center justify-center h-48 text-slate-500">No sentiment data to display.</div>;
    }
    
    const radius = 60;
    const strokeWidth = 15;
    const circumference = 2 * Math.PI * radius;

    const positivePercent = (positive / total);
    const negativePercent = (negative / total);
    
    const posStroke = positivePercent * circumference;
    const negStroke = negativePercent * circumference;

    const negOffset = (1 - negativePercent) * circumference;
    const posOffset = (1 - negativePercent - positivePercent) * circumference;
    
    return (
        <div className="relative w-full aspect-square mx-auto max-w-[12rem]">
            <svg className="absolute inset-0" viewBox="0 0 150 150" role="img" aria-labelledby="donut-chart-title donut-chart-desc">
                <title id="donut-chart-title">Sentiment Distribution</title>
                <desc id="donut-chart-desc">A donut chart showing the proportion of customer feedback. Green is positive, red is negative, and grey is neutral.</desc>
                <circle cx="75" cy="75" r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-slate-200 dark:stroke-slate-600"/>
                
                {/* Positive Segment */}
                {positive > 0 && <circle cx="75" cy="75" r={radius} fill="none" strokeWidth={strokeWidth}
                        strokeDasharray={`${posStroke} ${circumference - posStroke}`} strokeDashoffset={posOffset}
                        transform="rotate(-90 75 75)" className="stroke-emerald-500 transition-all duration-500" />}
                
                {/* Negative Segment */}
                {negative > 0 && <circle cx="75" cy="75" r={radius} fill="none" strokeWidth={strokeWidth}
                        strokeDasharray={`${negStroke} ${circumference - negStroke}`} strokeDashoffset={negOffset}
                        transform="rotate(-90 75 75)" className="stroke-rose-500 transition-all duration-500" />}

            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Total Points</p>
            </div>
        </div>
    );
};

const FeedbackBreakdownChart: React.FC<{ data: { pros: number, cons: number, themes: number } }> = ({ data }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(400);

    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current) {
                setChartWidth(chartRef.current.offsetWidth);
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        const currentRef = chartRef.current;

        if (currentRef) {
            resizeObserver.observe(currentRef);
            handleResize(); // Initial size calculation
        }

        return () => {
            if (currentRef) {
                resizeObserver.unobserve(currentRef);
            }
        };
    }, []);

    const chartData = [
        { label: 'Pros', value: data.pros, color: 'fill-emerald-500' },
        { label: 'Cons', value: data.cons, color: 'fill-rose-500' },
        { label: 'Themes', value: data.themes, color: 'fill-amber-500' },
    ];

    const maxValue = Math.max(...chartData.map(d => d.value), 1); // Avoid division by zero
    const chartHeight = 150;
    const barHeight = 30;
    const barMargin = 15;
    const labelWidth = 60;
    const valueLabelWidth = 40;

    return (
        <div ref={chartRef}>
            <h4 className="font-semibold mb-2 text-center text-slate-700 dark:text-slate-300">Feedback Breakdown</h4>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" role="img" aria-labelledby="breakdown-chart-title breakdown-chart-desc">
                <title id="breakdown-chart-title">Feedback Breakdown by Category</title>
                <desc id="breakdown-chart-desc">A horizontal bar chart showing the total count of pros ({data.pros}), cons ({data.cons}), and common themes ({data.themes}).</desc>
                {chartData.map((item, index) => {
                    const y = index * (barHeight + barMargin);
                    const barSpace = Math.max(0, chartWidth - labelWidth - valueLabelWidth);
                    const barWidth = item.value > 0 ? (item.value / maxValue) * barSpace : 0;
                    
                    const valueTextFitsInside = barWidth > 35;
                    const textX = valueTextFitsInside ? labelWidth + barWidth - 5 : labelWidth + barWidth + 5;
                    const textAnchor = valueTextFitsInside ? 'end' : 'start';
                    const textColorClass = valueTextFitsInside ? 'fill-white' : 'fill-slate-800 dark:fill-slate-100';

                    return (
                        <g key={item.label} transform={`translate(0, ${y})`}>
                            <text 
                                x={labelWidth - 5} 
                                y={barHeight / 2} 
                                dominantBaseline="middle" 
                                textAnchor="end"
                                className="text-sm font-medium fill-slate-600 dark:fill-slate-300"
                            >
                                {item.label}
                            </text>
                            <rect 
                                x={labelWidth} 
                                y="0"
                                width={barWidth} 
                                height={barHeight} 
                                rx="4"
                                className={item.color} 
                            />
                            <text
                                x={textX}
                                y={barHeight / 2}
                                dominantBaseline="middle"
                                textAnchor={textAnchor}
                                className={`text-sm font-bold transition-all ${textColorClass}`}
                            >
                                {item.value}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};


export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ summary, isCompact = false }) => {
    const { positive, negative } = summary.sentiment;
    const total = positive + negative + summary.sentiment.neutral;
    const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;
    const negativePercent = total > 0 ? Math.round((negative / total) * 100) : 0;
    const topTheme = summary.themes?.[0] || 'N/A';
    const breakdownData = {
        pros: summary.pros.length,
        cons: summary.cons.length,
        themes: summary.themes.length
    };


    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-6">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Analytics Dashboard</h3>

            <div className={`grid grid-cols-1 ${isCompact ? '' : 'md:grid-cols-3'} gap-4`}>
                 <StatCard 
                    icon={<TrendingUpIcon className="w-5 h-5 text-emerald-800 dark:text-emerald-200" />}
                    label="Positive Sentiment"
                    value={`${positivePercent}%`}
                    iconColor="bg-emerald-200 dark:bg-emerald-500/30"
                />
                <StatCard 
                    icon={<TrendingDownIcon className="w-5 h-5 text-rose-800 dark:text-rose-200" />}
                    label="Negative Sentiment"
                    value={`${negativePercent}%`}
                    iconColor="bg-rose-200 dark:bg-rose-500/30"
                />
                 <StatCard 
                    icon={<HashtagIcon className="w-5 h-5 text-sky-800 dark:text-sky-200" />}
                    label="Top Theme"
                    value={topTheme}
                    iconColor="bg-sky-200 dark:bg-sky-500/30"
                    allowWrap={true}
                />
            </div>
            
            <div className={`grid grid-cols-1 ${isCompact ? '' : 'lg:grid-cols-2'} gap-6 items-center pt-6 border-t border-slate-200 dark:border-slate-700`}>
                <div>
                     <DonutChart data={summary.sentiment} />
                </div>
                <div>
                     <FeedbackBreakdownChart data={breakdownData} />
                </div>
            </div>
        </div>
    );
};