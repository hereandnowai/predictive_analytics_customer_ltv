import React from 'react';
import { LTVDistributionBucket } from '../types';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';

interface StatsDisplayProps {
  averageLTV: number;
  distribution: LTVDistributionBucket[];
}

const LTVDistributionChart: React.FC<{ data: LTVDistributionBucket[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">No LTV data available for distribution chart.</p>;
  }

  const maxCount = Math.max(...data.map(item => item.count), 0);
  const chartHeight = 150; // SVG height
  const barWidth = 35;
  const barMargin = 10;
  const totalWidth = data.length * (barWidth + barMargin) - barMargin;

  return (
    <div className="mt-2 overflow-x-auto">
      <svg width={totalWidth > 0 ? totalWidth : 200} height={chartHeight + 30} aria-label="LTV Distribution Chart">
        <title>LTV Distribution</title>
        {data.map((item, index) => {
          const barHeight = maxCount > 0 ? (item.count / maxCount) * chartHeight : 0;
          const x = index * (barWidth + barMargin);
          const y = chartHeight - barHeight;
          return (
            <g key={item.range}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                className="fill-secondary hover:opacity-75 transition-opacity"
                aria-label={`Range ${item.range}: ${item.count} customers`}
              >
                <title>{`${item.range}: ${item.count} customers`}</title>
              </rect>
              <text x={x + barWidth / 2} y={chartHeight + 15} textAnchor="middle" className="text-xs fill-gray-400">
                {item.range.replace('$', '')} {/* Compact label */}
              </text>
               <text x={x + barWidth / 2} y={y - 5 > 10 ? y - 5 : 10} textAnchor="middle" className="text-xs font-semibold fill-gray-200">
                {item.count > 0 ? item.count : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ averageLTV, distribution }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-200 mb-4">Key Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700/50 p-4 rounded-lg flex items-center">
          <DollarSignIcon className="h-8 w-8 text-primary mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-400">Average Predicted LTV</p>
            <p className="text-2xl font-bold text-primary">${averageLTV.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-lg flex items-center">
          <UsersIcon className="h-8 w-8 text-secondary mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-400">Total Customers with LTV</p>
            <p className="text-2xl font-bold text-secondary">{distribution.reduce((sum, bucket) => sum + bucket.count, 0)}</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-700/50 p-4 rounded-lg">
         <h4 className="text-md font-semibold text-gray-300 mb-2 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-secondary"/> LTV Distribution
        </h4>
        <LTVDistributionChart data={distribution} />
      </div>
    </div>
  );
};