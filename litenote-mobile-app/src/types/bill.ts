/**
 * 账单相关类型定义
 */
import type { CategoryData } from './category';
import type { CustomerData } from './customer';

export type BillType = 'entry' | 'settlement' | 'expense';

export interface BillData {
  id: number;
  amount: number;
  type: BillType;
  description?: string;
  date: string;
  categoryId?: number;
  customerId?: number;
  isSettled?: boolean;         // 仅 entry 类型有意义
  settledAt?: string;
  relatedEntryIds?: number[];  // settlement 类型关联的入账ID
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: CategoryData;
  customer?: CustomerData;
}

export interface CreateBillDto {
  amount: number;
  type: BillType;
  description?: string;
  date: string;
  categoryId?: number;
  customerId?: number;
  relatedEntryIds?: number[];  // settlement 类型必填
}

export interface UpdateBillDto {
  amount?: number;
  type?: BillType;
  description?: string;
  date?: string;
  categoryId?: number;
  customerId?: number;
}

export interface BillQueryParams {
  page?: number;
  limit?: number;
  type?: BillType;
  categoryId?: number;
  customerId?: number;
  isSettled?: boolean;
  startDate?: string;
  endDate?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SettleBatchDto {
  billIds: number[];
  paymentMethod?: string;
}

export interface HomeStatistics {
  totalRevenue: number;      // 本月营业额（所有 entry 合计）
  monthlyEntry: number;      // 本月入账（新增未结清）
  monthlySettled: number;    // 本月结清（settlement 合计）
  monthlyExpense: number;    // 本月支出
  unsettledAmount: number;   // 未结清总额
  unsettledCount: number;    // 未结清笔数
  recentBills: BillData[];
  topDebtors: Array<{
    customerId: number;
    customerName: string;
    customerPhone?: string | null;
    totalAmount: number;
    billCount: number;
  }>;
}

export interface CategoryStatistic {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  entry: number;
  settlement: number;
  expense: number;
}

export interface DailyTrend {
  date: string;
  entry: number;
  settlement: number;
  expense: number;
}

export interface BillStatistics {
  totalEntry: number;
  totalSettlement: number;
  totalExpense: number;
  entryCount: number;
  settlementCount: number;
  expenseCount: number;
  entryCategoryStats: CategoryStatistic[];
  expenseCategoryStats: CategoryStatistic[];
  monthlyTrends: MonthlyTrend[];
  dailyTrends: DailyTrend[];
}
