export enum CustomerSegment {
  HIGH_VALUE = 'High-Value',
  MEDIUM_VALUE = 'Medium-Value',
  LOW_VALUE = 'Low-Value',
  AT_RISK = 'At-Risk',
  NEW = 'New',
  UNKNOWN = 'Unknown'
}

export interface Purchase {
  id: string;
  date: string; // "YYYY-MM-DD"
  amount: number;
  items?: string[]; 
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  joinDate: string; // "YYYY-MM-DD"
  avatarUrl: string;
  purchases: Purchase[];
  predictedLTV?: number;
  segment?: CustomerSegment;
  retentionStrategies?: string[];
  marketingIdeas?: string[];
  
  // CSV-derived fields (optional, for reference or if not fully fitting into purchases)
  totalSpentCSV?: number;
  purchaseCountCSV?: number;
  lastPurchaseDateCSV?: string;

  // UI state
  isAnalyzingLTV?: boolean;
  isFetchingRetention?: boolean;
  isFetchingMarketing?: boolean;
  error?: string | null;
}

export interface LTVDistributionBucket {
  range: string; // e.g., "$0 - $100"
  count: number;
}
