import React from 'react';
import { Customer, CustomerSegment } from '../types';
import { BrainIcon } from './icons/BrainIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { TagIcon } from './icons/TagIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { LoadingSpinner } from './LoadingSpinner';

interface CustomerCardProps {
  customer: Customer;
  onAnalyzeLTV: (customerId: string) => Promise<void>;
  onGetRetentionStrategies: (customerId: string) => Promise<void>;
  onGetMarketingIdeas: (customerId: string) => Promise<void>;
}

const ActionButton: React.FC<{ 
  onClick: () => void; 
  isLoading: boolean; 
  disabled?: boolean; 
  text: string; 
  icon: React.ReactNode; 
  colorClass: string;
  textColorClass: string;
}> = ({ onClick, isLoading, disabled, text, icon, colorClass, textColorClass }) => (
  <button
    onClick={onClick}
    disabled={isLoading || disabled}
    className={`w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm ${textColorClass} ${colorClass} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-current transition-opacity duration-150`}
    aria-label={`${text} for ${disabled ? 'disabled' : ''}`}
  >
    {isLoading ? <LoadingSpinner /> : icon}
    <span className="ml-2">{text}</span>
  </button>
);

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onAnalyzeLTV,
  onGetRetentionStrategies,
  onGetMarketingIdeas,
}) => {
  const totalSpent = customer.purchases.reduce((sum, p) => sum + p.amount, 0);

  const getSegmentColor = (segment?: CustomerSegment): string => {
    if (!segment) return 'text-gray-400';
    switch (segment) {
      case CustomerSegment.HIGH_VALUE: return 'text-emerald-400';
      case CustomerSegment.MEDIUM_VALUE: return 'text-sky-400';
      case CustomerSegment.LOW_VALUE: return 'text-amber-400'; // Existing accent color, keep for segment differentiation
      case CustomerSegment.AT_RISK: return 'text-red-400';
      case CustomerSegment.NEW: return 'text-indigo-400';
      default: return 'text-gray-400';
    }
  };

  // HERE AND NOW AI Branding Colors
  const brandColors = {
    primaryBg: 'bg-primary', // #FFDF00
    primaryText: 'text-neutral-dark', // Dark text for primary bg
    secondaryBg: 'bg-secondary', // #004040
    secondaryText: 'text-white', // Light text for secondary bg
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-primary/20 flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex items-center space-x-4 mb-5">
          <img 
            src={customer.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=FFDF00&color=004040&rounded=true&size=64`} 
            alt={customer.name} 
            className="h-16 w-16 rounded-full border-2 border-primary" 
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-100">{customer.name}</h3>
            <p className="text-sm text-gray-400 break-all">{customer.email}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm mb-6 text-gray-300">
          <div className="flex items-center"><CalendarDaysIcon className="h-5 w-5 text-sky-400 mr-2 flex-shrink-0" /> Joined: {customer.joinDate}</div>
          <div className="flex items-center"><ShoppingBagIcon className="h-5 w-5 text-emerald-400 mr-2 flex-shrink-0" /> Purchases: {customer.purchases.length}</div>
          <div className="flex items-center"><ChartBarIcon className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0" /> 
            Total Spent (from data): ${totalSpent.toFixed(2)}
            {customer.totalSpentCSV !== undefined && customer.totalSpentCSV !== totalSpent && (
                <span className="text-xs text-gray-500 ml-1">(CSV total: ${customer.totalSpentCSV.toFixed(2)})</span>
            )}
          </div>
           {customer.purchaseCountCSV !== undefined && (
             <div className="flex items-center text-xs text-gray-500"><ShoppingBagIcon className="h-4 w-4 text-gray-500 mr-1.5 flex-shrink-0" /> Reported purchase count (CSV): {customer.purchaseCountCSV}</div>
           )}
        </div>
        
        {customer.error && (
          <div className="my-3 p-3 bg-red-700/50 border border-red-500 text-red-300 rounded-md text-xs">
            <p className="font-semibold">Error:</p>
            <p>{customer.error}</p>
          </div>
        )}

        {/* LTV Analysis Section */}
        <div className="mb-5 p-4 bg-slate-700/50 rounded-lg">
          <h4 className="text-md font-semibold text-gray-200 mb-2 flex items-center"><BrainIcon className="h-5 w-5 mr-2 text-primary flex-shrink-0" /> LTV Analysis</h4>
          {!customer.predictedLTV && !customer.isAnalyzingLTV && (
            <ActionButton
              onClick={() => onAnalyzeLTV(customer.id)}
              isLoading={!!customer.isAnalyzingLTV}
              text="Analyze LTV & Segment"
              icon={<BrainIcon className="h-5 w-5" />}
              colorClass={brandColors.primaryBg}
              textColorClass={brandColors.primaryText}
            />
          )}
          {customer.isAnalyzingLTV && <div className="flex justify-center py-2"><LoadingSpinner /></div>}
          {customer.predictedLTV !== undefined && customer.segment && (
            <div className="space-y-1 text-sm">
              <p className="flex items-center"><DollarSignIcon className="h-4 w-4 mr-1.5 text-green-400 flex-shrink-0" /> Predicted LTV: <span className="font-semibold text-green-400 ml-1">${customer.predictedLTV.toFixed(2)}</span></p>
              <p className="flex items-center"><TagIcon className="h-4 w-4 mr-1.5 flex-shrink-0" /> Segment: <span className={`font-semibold ml-1 ${getSegmentColor(customer.segment)}`}>{customer.segment}</span></p>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 pt-0 mt-auto">
        {customer.predictedLTV !== undefined && (
          <div className="mb-5 p-4 bg-slate-700/50 rounded-lg">
            <h4 className="text-md font-semibold text-gray-200 mb-2 flex items-center"><ShieldCheckIcon className="h-5 w-5 mr-2 text-secondary flex-shrink-0" /> Retention Strategies</h4>
            {!customer.retentionStrategies && !customer.isFetchingRetention && (
              <ActionButton
                onClick={() => onGetRetentionStrategies(customer.id)}
                isLoading={!!customer.isFetchingRetention}
                text="Suggest Retention Strategies"
                icon={<ShieldCheckIcon className="h-5 w-5" />}
                colorClass={brandColors.secondaryBg}
                textColorClass={brandColors.secondaryText}
              />
            )}
            {customer.isFetchingRetention && <div className="flex justify-center py-2"><LoadingSpinner /></div>}
            {customer.retentionStrategies && (
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-300 pl-1">
                {customer.retentionStrategies.map((strategy, index) => (
                  <li key={index}>{strategy}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {customer.predictedLTV !== undefined && (
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <h4 className="text-md font-semibold text-gray-200 mb-2 flex items-center"><MegaphoneIcon className="h-5 w-5 mr-2 text-secondary flex-shrink-0" /> Personalized Marketing</h4>
            {!customer.marketingIdeas && !customer.isFetchingMarketing && (
              <ActionButton
                onClick={() => onGetMarketingIdeas(customer.id)}
                isLoading={!!customer.isFetchingMarketing}
                text="Suggest Marketing Ideas"
                icon={<MegaphoneIcon className="h-5 w-5" />}
                colorClass={brandColors.secondaryBg} // Changed from accent to secondary
                textColorClass={brandColors.secondaryText}
              />
            )}
            {customer.isFetchingMarketing && <div className="flex justify-center py-2"><LoadingSpinner /></div>}
            {customer.marketingIdeas && (
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-300 pl-1">
                {customer.marketingIdeas.map((idea, index) => (
                  <li key={index}>{idea}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};