/**
 * 账单相关类型定义
 */
import type { CategoryData } from './category';
import type { CustomerData } from './customer';

export type BillType = 'income' | 'expense' | 'credit';

export interface BillData {
  id: number;
  amount: number;
  type: BillType;
  description?: string;
  date: string;
  categoryId?: number;
  customerId?: number;
  isSettled?: boolean;
  settledAt?: string;
  settledBatchId?: number;
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
  // 农资商户核心指标
  totalRevenue: number;        // 本月营业额（income + credit 合计）
  monthlyCredit: number;       // 本月赊账（type=credit, isSettled=false）
  monthlySettled: number;      // 本月结清（type=credit, isSettled=true）
  unsettledCreditCount: number;// 未结算赊账笔数
  // 保留供统计分析使用
  totalIncome: number;         // 本月现金收入
  totalExpense: number;        // 本月支出
  // 详情
  recentBills: BillData[];
  topDebtors: Array<{
    customerId: number;
    customerName: string;
    customerPhone?: string;
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
  income: number;
  expense: number;
}

export interface DailyTrend {
  date: string;
  income: number;
  expense: number;
}

export interface BillStatistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  expenseCategoryStats: CategoryStatistic[];
  incomeCategoryStats: CategoryStatistic[];
  monthlyTrends: MonthlyTrend[];
  dailyTrends: DailyTrend[];
}
