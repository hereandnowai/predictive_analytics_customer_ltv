import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './icons/UploadCloudIcon';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setFileName(file.name);
        onFileUpload(file);
        setError(null);
      } else {
        setError('Invalid file type. Please upload a CSV file.');
        setFileName(null);
        event.target.value = ''; // Reset file input
      }
    } else {
      setFileName(null);
    }
  }, [onFileUpload]);

  return (
    <div className="w-full">
      <label
        htmlFor="csv-upload"
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${disabled ? 'bg-slate-700 border-slate-600 cursor-not-allowed' : 'bg-slate-700/50 border-slate-600 hover:border-primary hover:bg-slate-700'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloudIcon className={`w-10 h-10 mb-3 ${disabled ? 'text-slate-500' : 'text-primary'}`} />
          <p className={`mb-2 text-sm ${disabled ? 'text-slate-500' : 'text-gray-400'}`}>
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className={`text-xs ${disabled ? 'text-slate-600' : 'text-gray-500'}`}>CSV file (max 5MB)</p>
          {fileName && !error && <p className="mt-2 text-xs text-green-400">Selected: {fileName}</p>}
        </div>
        <input 
            id="csv-upload" 
            type="file" 
            className="hidden" 
            accept=".csv,text/csv" 
            onChange={handleFileChange}
            disabled={disabled}
            aria-describedby={error ? "file-error" : undefined}
        />
      </label>
      {error && <p id="file-error" className="mt-2 text-sm text-red-400">{error}</p>}
       <p className="mt-2 text-xs text-gray-500">
        Required CSV columns: <code className="text-gray-400">id, name, email, total_spent, purchase_count, last_purchase_date</code> (header row required).
      </p>
    </div>
  );
};