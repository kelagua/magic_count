import client from './client';
import type {
  Bill,
  BillQuery,
  CreateBillRequest,
  UpdateBillRequest,
  SettleBatchRequest,
  SettleBatchResponse,
  StatisticsData,
  HomeStatistics,
  Pagination,
  ApiResponse,
} from '../types';

// 后端返回的列表接口格式: { success, message, data: T[], pagination: Pagination }
export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export const billsApi = {
  getBills: async (params?: BillQuery): Promise<ListResponse<Bill>> => {
    const res = await client.get('/bills', { params });
    return res.data;
  },

  getBill: async (id: number): Promise<ApiResponse<Bill>> => {
    const res = await client.get(`/bills/${id}`);
    return res.data;
  },

  createBill: async (data: CreateBillRequest): Promise<ApiResponse<Bill>> => {
    const res = await client.post('/bills', data);
    return res.data;
  },

  updateBill: async (id: number, data: UpdateBillRequest): Promise<ApiResponse<Bill>> => {
    const res = await client.patch(`/bills/${id}`, data);
    return res.data;
  },

  deleteBill: async (id: number): Promise<ApiResponse> => {
    const res = await client.delete(`/bills/${id}`);
    return res.data;
  },

  getStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'daily' | 'monthly';
  }): Promise<ApiResponse<StatisticsData>> => {
    const res = await client.get('/bills/statistics', { params });
    return res.data;
  },

  getHomeStatistics: async (): Promise<ApiResponse<HomeStatistics>> => {
    const res = await client.get('/bills/statistics/home');
    return res.data;
  },

  settleBatch: async (data: SettleBatchRequest): Promise<ApiResponse<SettleBatchResponse>> => {
    const res = await client.post('/bills/settle-batch', data);
    return res.data;
  },
};
