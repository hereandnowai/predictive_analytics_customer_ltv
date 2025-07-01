import React, { useState, useMemo } from 'react';
import { Customer, CustomerSegment } from '../types';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface CustomerTableProps {
  customers: Customer[];
}

type SortKey = keyof Pick<Customer, 'name' | 'email' | 'predictedLTV' | 'segment'> | 'id';
type SortOrder = 'asc' | 'desc';

const getSegmentColorClass = (segment?: CustomerSegment): string => {
  if (!segment) return 'text-gray-400';
  switch (segment) {
    case CustomerSegment.HIGH_VALUE: return 'text-emerald-400';
    case CustomerSegment.MEDIUM_VALUE: return 'text-sky-400';
    case CustomerSegment.LOW_VALUE: return 'text-amber-400';
    case CustomerSegment.AT_RISK: return 'text-red-400';
    case CustomerSegment.NEW: return 'text-indigo-400';
    default: return 'text-gray-400';
  }
};


export const CustomerTable: React.FC<CustomerTableProps> = ({ customers }) => {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      let comparison = 0;
      if (valA === undefined && valB !== undefined) comparison = -1;
      else if (valA !== undefined && valB === undefined) comparison = 1;
      else if (valA === undefined && valB === undefined) comparison = 0;
      else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else {
        // Fallback for mixed types or other types (treat as strings)
        comparison = String(valA).localeCompare(String(valB));
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [customers, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const SortIcon: React.FC<{ columnKey: SortKey }> = ({ columnKey }) => {
    if (sortKey !== columnKey) return <ChevronDownIcon className="h-4 w-4 ml-1 text-gray-500 opacity-50" />; 
    return sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1 text-primary" /> : <ChevronDownIcon className="h-4 w-4 ml-1 text-primary" />;
  };
  
  const TableHeader: React.FC<{ columnKey: SortKey, label: string, className?: string }> = ({ columnKey, label, className }) => (
    <th 
        scope="col"
        className={`px-4 py-3.5 text-left text-sm font-semibold text-gray-200 cursor-pointer hover:bg-slate-700 ${className || ''}`}
        onClick={() => handleSort(columnKey)}
        aria-sort={sortKey === columnKey ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
        <div className="flex items-center">
        {label}
        <SortIcon columnKey={columnKey} />
        </div>
    </th>
  );


  if (!customers.length) {
    return <p className="text-center text-gray-500 mt-8">No customers match your search criteria or no data loaded.</p>;
  }

  return (
    <div className="overflow-x-auto bg-slate-800 shadow-xl rounded-lg">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-700/50">
          <tr>
            <TableHeader columnKey="id" label="ID" className="w-1/6"/>
            <TableHeader columnKey="name" label="Name" className="w-1/4"/>
            <TableHeader columnKey="email" label="Email" className="w-1/4"/>
            <TableHeader columnKey="predictedLTV" label="Predicted LTV ($)" className="w-1/6 text-right"/>
            <TableHeader columnKey="segment" label="Segment" className="w-1/6"/>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700 bg-slate-800">
          {sortedCustomers.map((customer) => (
            <tr key={customer.id} className="hover:bg-slate-700/30 transition-colors">
              <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-400">{customer.id}</td>
              <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-200">{customer.name}</td>
              <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-300">{customer.email}</td>
              <td className="whitespace-nowrap px-4 py-4 text-sm text-right">
                {customer.predictedLTV !== undefined ? (
                  <span className="font-semibold text-primary">${customer.predictedLTV.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-sm">
                {customer.segment ? (
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getSegmentColorClass(customer.segment).replace('text-', 'bg-').replace('-400', '-500/20')} ${getSegmentColorClass(customer.segment)}`}>
                    {customer.segment}
                  </span>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};