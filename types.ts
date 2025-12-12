export type Currency = 'TWD' | 'USD' | 'JPY';

export enum AssetType {
  CASH = '現金與銀行',
  STOCK = '股票投資',
  CREDIT_CARD = '信用卡',
  CRYPTO = '加密貨幣',
  OTHER = '其他資產',
}

export interface Holding {
  id: string;
  name: string; // e.g., 中國信託, 台積電
  ticker?: string; // e.g., 2330, TSLA (Optional for Cash)
  type: AssetType;
  price: number; // Unit price (1 for Cash)
  quantity: number;
  currency: Currency; 
  color?: string; // For the chart
  change24h: number;
  billDay?: number; // Only for Credit Card (1-31)
  lastUpdated?: number; // Unix Timestamp (ms)
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}

// Changed to string to support dynamic categories
export type TransactionCategory = string;

export interface CategoryDef {
  id: string;
  label: string;
  icon: string; // Icon name key
  color: string;
  keywords: string[];
}

export interface Transaction {
  id: string;
  type: 'EXPENSE' | 'INCOME'; // New field
  date: string; // ISO String
  amount: number;
  category: TransactionCategory;
  note: string;
  sourceAssetId?: string; // Which asset paid for this?
  sourceAssetName?: string;
}

export type AutomationType = 'RECURRING' | 'DCA_INVEST';

export interface Automation {
  id: string;
  name: string;
  type: AutomationType;
  amount: number; // Fixed amount for recurring, Budget for DCA
  currency: Currency; // Usually TWD
  dayOfMonth: number; // 1-31
  
  // For Recurring (Income/Expense)
  category?: string;
  transactionType?: 'INCOME' | 'EXPENSE';
  targetAssetId?: string; // Bank for Income, Card/Bank for Expense
  
  // For DCA
  sourceAssetId?: string; // Bank to deduct from
  investAssetId?: string; // Stock to buy
  
  active: boolean;
  lastRun?: string;
}

export interface SystemLog {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  amount?: string;
}