import { Customer, LTVDistributionBucket } from '../types';

export interface LTVBucketConfig {
  min: number;
  max: number;
  label: string;
}

export const LTV_BUCKETS_CONFIG: LTVBucketConfig[] = [
  { min: 0, max: 50, label: '$0-50' },
  { min: 51, max: 100, label: '$51-100' },
  { min: 101, max: 250, label: '$101-250' },
  { min: 251, max: 500, label: '$251-500' },
  { min: 501, max: 1000, label: '$501-1k' },
  { min: 1001, max: Infinity, label: '$1k+' },
];

export const calculateLtvDistribution = (
  customers: Customer[],
  bucketsConfig: LTVBucketConfig[]
): LTVDistributionBucket[] => {
  const distribution: LTVDistributionBucket[] = bucketsConfig.map(bucket => ({
    range: bucket.label,
    count: 0,
  }));

  customers.forEach(customer => {
    if (typeof customer.predictedLTV === 'number') {
      for (let i = 0; i < bucketsConfig.length; i++) {
        if (customer.predictedLTV >= bucketsConfig[i].min && customer.predictedLTV <= bucketsConfig[i].max) {
          distribution[i].count++;
          break;
        }
      }
    }
  });

  return distribution;
};
