import client from './client';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Bill,
  Pagination,
  ApiResponse,
} from '../types';

export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export const customersApi = {
  getCustomers: async (params?: { search?: string }): Promise<ApiResponse<Customer[]>> => {
    const res = await client.get('/customers', { params });
    return res.data;
  },

  getCustomer: async (id: number): Promise<ApiResponse<Customer>> => {
    const res = await client.get(`/customers/${id}`);
    return res.data;
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<ApiResponse<Customer>> => {
    const res = await client.post('/customers', data);
    return res.data;
  },

  updateCustomer: async (id: number, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> => {
    const res = await client.patch(`/customers/${id}`, data);
    return res.data;
  },

  deleteCustomer: async (id: number): Promise<ApiResponse> => {
    const res = await client.delete(`/customers/${id}`);
    return res.data;
  },

  getCustomerBills: async (
    id: number,
    params?: {
      page?: number;
      limit?: number;
      type?: string;
      isSettled?: boolean;
    },
  ): Promise<ListResponse<Bill>> => {
    const res = await client.get(`/customers/${id}/bills`, { params });
    return res.data;
  },
};
