
import React from 'react';
import { Customer } from '../types';
import { CustomerCard } from './CustomerCard';

interface CustomerListProps {
  customers: Customer[];
  onAnalyzeLTV: (customerId: string) => Promise<void>;
  onGetRetentionStrategies: (customerId: string) => Promise<void>;
  onGetMarketingIdeas: (customerId: string) => Promise<void>;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onAnalyzeLTV,
  onGetRetentionStrategies,
  onGetMarketingIdeas,
}) => {
  if (!customers.length) {
    return <p className="text-center text-gray-500 mt-8">No customers to display.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {customers.map(customer => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onAnalyzeLTV={onAnalyzeLTV}
          onGetRetentionStrategies={onGetRetentionStrategies}
          onGetMarketingIdeas={onGetMarketingIdeas}
        />
      ))}
    </div>
  );
};
