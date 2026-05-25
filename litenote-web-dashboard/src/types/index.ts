// ==================== 基础类型 ====================

export type BillType = 'income' | 'expense' | 'credit';
export type CategoryType = 'income' | 'expense';

// ==================== 用户相关 ====================

export interface User {
  id: string;
  username: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ==================== 分类相关 ====================

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  sortOrder?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  type?: CategoryType;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// ==================== 客户相关 ====================

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

// ==================== 账单相关 ====================

export interface Bill {
  id: number;
  amount: number;
  type: BillType;
  description?: string;
  date: string;
  categoryId?: number;
  customerId?: number;
  isSettled: boolean;
  settledAt?: string;
  settledBatchId?: string;
  userId: string;
  category?: Category;
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillRequest {
  amount: number;
  type: BillType;
  description?: string;
  date: string;
  categoryId?: number;
  customerId?: number;
}

export interface UpdateBillRequest {
  amount?: number;
  type?: BillType;
  description?: string;
  date?: string;
  categoryId?: number;
  customerId?: number;
}

export interface BillQuery {
  page?: number;
  limit?: number;
  type?: BillType;
  categoryId?: number;
  customerId?: number;
  isSettled?: boolean;
  startDate?: string;
  endDate?: string;
  orderBy?: 'date' | 'amount' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface SettleBatchRequest {
  billIds: number[];
  paymentMethod?: string;
}

export interface SettleBatchResponse {
  settledBatchId: string;
  settledAt: string;
  paymentMethod?: string;
  settledCount: number;
  totalAmount: number;
  bills: Bill[];
}

// ==================== 分页 ====================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ==================== 统计相关 ====================

export interface CategoryStat {
  categoryId: number | null;
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

export interface StatisticsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  expenseCategoryStats: CategoryStat[];
  incomeCategoryStats: CategoryStat[];
  monthlyTrends: MonthlyTrend[];
  dailyTrends: DailyTrend[];
}

export interface TopDebtor {
  customerId: number;
  customerName: string;
  customerPhone?: string | null;
  totalAmount: number;
  billCount: number;
}

export interface HomeStatistics {
  totalUnsettledCredits: number;
  unsettledCreditCount: number;
  totalIncome: number;
  totalExpense: number;
  monthlyCredit: number;
  monthlySettledCredits: number;
  recentBills: Bill[];
  topDebtors: TopDebtor[];
}

// ==================== API 通用响应 ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
