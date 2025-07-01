
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Header } from './components/Header';
import { CustomerList } from './components/CustomerList';
import { CustomerTable } from './components/CustomerTable';
import { FileUpload } from './components/FileUpload';
import { SearchBar } from './components/SearchBar';
import { StatsDisplay } from './components/StatsDisplay';
import { Customer, CustomerSegment, Purchase, LTVDistributionBucket } from './types';
import { geminiService } from './services/geminiService';
import { processUploadedCsvData, exportCustomersToCsv } from './utils/csvHelper';
import { calculateLtvDistribution, LTV_BUCKETS_CONFIG } from './utils/dataAnalysisHelper';
import { LoadingSpinner } from './components/LoadingSpinner'; // Assuming LoadingSpinner is moved or made global

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | null>(null);

  const modalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;

  // HERE AND NOW AI Branding
  const brand = {
    shortName: "HERE AND NOW AI",
    slogan: "designed with passion for innovation",
    socialMedia: {
      blog: "https://hereandnowai.com/blog",
      linkedin: "https://www.linkedin.com/company/hereandnowai/",
      instagram: "https://instagram.com/hereandnow_ai",
      github: "https://github.com/hereandnowai",
      x: "https://x.com/hereandnow_ai",
      youtube: "https://youtube.com/@hereandnow_ai"
    }
  };


  useEffect(() => {
    // Clear global error when customers change, e.g., after new CSV upload
    setGlobalError(null);
  }, [customers]);

  const updateCustomerState = useCallback((customerId: string, updates: Partial<Customer>) => {
    setCustomers(prevCustomers =>
      prevCustomers.map(c => (c.id === customerId ? { ...c, ...updates, error: null } : c))
    );
  }, []);

  const handleAnalyzeLTV = useCallback(async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    updateCustomerState(customerId, { isAnalyzingLTV: true });
    try {
      const result = await geminiService.predictLTV(customer);
      updateCustomerState(customerId, {
        predictedLTV: result.ltv,
        segment: result.segment,
        isAnalyzingLTV: false,
      });
    } catch (error) {
      console.error(`Error analyzing LTV for ${customer.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze LTV.';
      updateCustomerState(customerId, { isAnalyzingLTV: false, error: errorMessage });
      setGlobalError(`Error for ${customer.name}: ${errorMessage}`);
    }
  }, [customers, updateCustomerState]);

  const handleGetRetentionStrategies = useCallback(async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.predictedLTV || !customer.segment) return;

    updateCustomerState(customerId, { isFetchingRetention: true });
    try {
      const strategies = await geminiService.getRetentionStrategies(customer.predictedLTV, customer.segment);
      updateCustomerState(customerId, { retentionStrategies: strategies, isFetchingRetention: false });
    } catch (error) {
      console.error(`Error fetching retention for ${customer.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch retention strategies.';
      updateCustomerState(customerId, { isFetchingRetention: false, error: errorMessage });
      setGlobalError(`Error for ${customer.name}: ${errorMessage}`);
    }
  }, [customers, updateCustomerState]);

  const handleGetMarketingIdeas = useCallback(async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.predictedLTV || !customer.segment) return;

    updateCustomerState(customerId, { isFetchingMarketing: true });
    try {
      const ideas = await geminiService.getMarketingIdeas(customer.predictedLTV, customer.segment);
      updateCustomerState(customerId, { marketingIdeas: ideas, isFetchingMarketing: false });
    } catch (error) {
      console.error(`Error fetching marketing for ${customer.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch marketing ideas.';
      updateCustomerState(customerId, { isFetchingMarketing: false, error: errorMessage });
      setGlobalError(`Error for ${customer.name}: ${errorMessage}`);
    }
  }, [customers, updateCustomerState]);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const newCustomers = await processUploadedCsvData(file);
      setCustomers(newCustomers);
    } catch (error) {
      console.error('Error processing CSV file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process CSV file.';
      setGlobalError(errorMessage);
      setCustomers([]); // Clear customers on CSV error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeAllLTVs = async () => {
    const customersToAnalyze = customers.filter(c => c.predictedLTV === undefined && !c.isAnalyzingLTV);
    if (customersToAnalyze.length === 0) {
      setGlobalError("All customers have LTV data or are being analyzed.");
      return;
    }
    
    setIsBulkAnalyzing(true);
    setGlobalError(null);
    setAnalysisProgress({ current: 0, total: customersToAnalyze.length });

    for (let i = 0; i < customersToAnalyze.length; i++) {
      const customer = customersToAnalyze[i];
      try {
        // Ensure handleAnalyzeLTV is awaited so progress updates correctly
        await handleAnalyzeLTV(customer.id);
      } catch (e) {
        // Error already handled by handleAnalyzeLTV and set on customer/globally
        console.error(`Bulk analysis error for ${customer.id}:`, e);
      }
      setAnalysisProgress({ current: i + 1, total: customersToAnalyze.length });
    }
    setIsBulkAnalyzing(false);
    setAnalysisProgress(null);
  };
  
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(
      customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const averageLTV = useMemo(() => {
    const ltvCustomers = customers.filter(c => typeof c.predictedLTV === 'number');
    if (ltvCustomers.length === 0) return 0;
    const totalLTV = ltvCustomers.reduce((sum, c) => sum + (c.predictedLTV || 0), 0);
    return totalLTV / ltvCustomers.length;
  }, [customers]);

  const ltvDistribution = useMemo(() => {
    return calculateLtvDistribution(customers.filter(c => typeof c.predictedLTV === 'number'), LTV_BUCKETS_CONFIG);
  }, [customers]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 flex flex-col">
      <Header />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        
        {modalRoot && (isBulkAnalyzing || isLoading) && ReactDOM.createPortal(
          <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex flex-col items-center justify-center z-[100]">
            <LoadingSpinner size="h-16 w-16" />
            {isBulkAnalyzing && analysisProgress && (
              <p className="text-xl text-white mt-4">Analyzing LTVs... ({analysisProgress.current}/{analysisProgress.total})</p>
            )}
            {isLoading && !isBulkAnalyzing && (
              <p className="text-xl text-white mt-4">Processing Data...</p>
            )}
          </div>,
          modalRoot
        )}

        {globalError && (
          <div className="bg-red-500 text-white p-4 rounded-md mb-6 shadow-lg transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Global Alert:</p>
                <p>{globalError}</p>
              </div>
              <button 
                onClick={() => setGlobalError(null)} 
                className="text-sm bg-red-700 hover:bg-red-800 px-2 py-1 rounded"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 p-6 bg-slate-800 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-primary mb-4">Upload Customer Data</h2>
          <FileUpload onFileUpload={handleFileUpload} disabled={isLoading || isBulkAnalyzing} />
        </div>

        {customers.length > 0 && (
          <>
            <div className="mb-6 p-6 bg-slate-800 rounded-lg shadow-xl">
               <StatsDisplay averageLTV={averageLTV} distribution={ltvDistribution} />
            </div>
           
            <div className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <SearchBar onSearch={setSearchTerm} disabled={isLoading || isBulkAnalyzing} />
                <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                  <button
                    onClick={handleAnalyzeAllLTVs}
                    disabled={isLoading || isBulkAnalyzing || customers.filter(c => c.predictedLTV === undefined && !c.isAnalyzingLTV).length === 0}
                    className="px-4 py-2 bg-primary hover:bg-yellow-300 text-neutral-dark font-semibold rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBulkAnalyzing ? 'Analyzing...' : `Analyze All LTVs (${customers.filter(c => c.predictedLTV === undefined && !c.isAnalyzingLTV).length})`}
                  </button>
                  <button
                    onClick={() => exportCustomersToCsv(customers, 'customer_ltv_data.csv')}
                    disabled={isLoading || isBulkAnalyzing}
                    className="px-4 py-2 bg-secondary hover:bg-teal-700 text-white font-semibold rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
               <div className="mt-4 flex justify-end">
                <div className="inline-flex rounded-md shadow-sm bg-slate-700 p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-l-md
                                ${viewMode === 'cards' ? 'bg-primary text-neutral-dark' : 'text-gray-300 hover:bg-slate-600'}
                                transition-colors duration-150 ease-in-out`}
                  >
                    Card View
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-r-md
                                ${viewMode === 'table' ? 'bg-primary text-neutral-dark' : 'text-gray-300 hover:bg-slate-600'}
                                transition-colors duration-150 ease-in-out border-l border-slate-600`}
                  >
                    Table View
                  </button>
                </div>
              </div>
            </div>
            
            {viewMode === 'cards' && (
              <CustomerList
                customers={filteredCustomers}
                onAnalyzeLTV={handleAnalyzeLTV}
                onGetRetentionStrategies={handleGetRetentionStrategies}
                onGetMarketingIdeas={handleGetMarketingIdeas}
              />
            )}
            {viewMode === 'table' && (
              <CustomerTable customers={filteredCustomers} />
            )}
          </>
        )}
        
        {customers.length === 0 && !isLoading && (
           <div className="mt-12 p-6 bg-slate-800 rounded-lg shadow-xl text-center">
            <h2 className="text-xl font-semibold text-gray-400">No customer data loaded.</h2>
            <p className="text-gray-500 mt-2">Please upload a CSV file to begin analysis with {brand.shortName}.</p>
           </div>
        )}

        <div className="mt-12 p-6 bg-slate-800 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-primary mb-4">Application Insights by {brand.shortName}</h2>
          <p className="text-gray-400">
            Upload your customer data via CSV to leverage AI for predicting customer lifetime value and receive tailored strategies.
            By understanding future customer behavior, businesses can optimize marketing spend, improve retention efforts, and ultimately drive profitability.
            The insights provided for each customer help in segmenting your audience and personalizing interactions for maximum impact. {brand.slogan}.
          </p>
        </div>
      </main>
      <footer className="text-center p-6 text-gray-500 text-sm border-t border-slate-700 mt-8">
        <p className="mb-2">© {new Date().getFullYear()} {brand.shortName}. All rights reserved.</p>
        <p className="mb-3 italic">{brand.slogan}</p>
        <div className="flex justify-center space-x-4">
          {Object.entries(brand.socialMedia).map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-primary capitalize">
              {platform}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default App;
