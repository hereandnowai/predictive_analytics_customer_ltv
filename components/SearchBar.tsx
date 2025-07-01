import React from 'react';
import { SearchIcon } from './icons/SearchIcon';

interface SearchBarProps {
  onSearch: (term: string) => void;
  disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, disabled }) => {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="search"
        placeholder="Search by name or email..."
        onChange={(e) => onSearch(e.target.value)}
        disabled={disabled}
        className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-md leading-5 bg-slate-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Search customers"
      />
    </div>
  );
};