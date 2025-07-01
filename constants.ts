import { Customer, CustomerSegment, Purchase } from './types';

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

export const MOCK_CUSTOMERS: Customer[] = []; // Data will now come from CSV upload

export const LTV_PROMPT_TEMPLATE = (customer: Customer): string => `
You are a predictive analytics expert specializing in Customer Lifetime Value (LTV).
Analyze the following customer's purchase history and predict their LTV for the next 12 months.
Also, classify this customer into one of these segments: High-Value, Medium-Value, Low-Value, At-Risk, New.
Provide your response strictly as a JSON object with keys 'predictedLTV' (a number, e.g., 450.75) and 'segment' (a string from the provided list).

Customer Data:
- ID: ${customer.id}
- Joined: ${customer.joinDate}
- Purchase History (Date: YYYY-MM-DD, Amount: USD):
  ${customer.purchases.map(p => `- Date: ${p.date}, Amount: $${p.amount.toFixed(2)}`).join('\n  ')}
${customer.purchaseCountCSV ? `- Original reported purchase count: ${customer.purchaseCountCSV}` : ''}

Consider factors like purchase frequency, average order value, recency of purchase, and overall spending trend.
If purchase history is sparse or very recent (e.g., joined in the last 3-6 months with few purchases), they might be 'New'.
If spending has declined significantly or purchases are infrequent after a period of activity, they might be 'At-Risk'.
Base 'High-Value', 'Medium-Value', 'Low-Value' on a combination of recency, frequency, and monetary value relative to typical customer behavior.

JSON Output Example:
{
  "predictedLTV": 500.75,
  "segment": "Medium-Value"
}
`;

export const RETENTION_STRATEGY_PROMPT_TEMPLATE = (ltv: number, segment: CustomerSegment): string => `
You are a customer retention strategist.
For a customer classified as '${segment}' with a predicted 12-month LTV of $${ltv.toFixed(2)}, suggest 3 distinct and actionable retention strategies.
Provide your response strictly as a JSON array of strings.

Example format:
[
  "Strategy 1: Detailed description of the strategy, why it's suitable for this segment/LTV, and a clear action.",
  "Strategy 2: Another detailed description...",
  "Strategy 3: A third detailed description..."
]
`;

export const MARKETING_IDEAS_PROMPT_TEMPLATE = (ltv: number, segment: CustomerSegment): string => `
You are a marketing personalization expert.
For a customer classified as '${segment}' with a predicted 12-month LTV of $${ltv.toFixed(2)}, suggest 3 personalized marketing efforts or promotions.
Provide your response strictly as a JSON array of strings.

Example format:
[
  "Marketing Idea 1: Description of the personalized offer, how it aligns with their LTV/segment, and the intended outcome.",
  "Marketing Idea 2: Another personalized idea...",
  "Marketing Idea 3: A third personalized idea..."
]
`;