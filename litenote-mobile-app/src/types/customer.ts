/**
 * 客户相关类型定义
 */

export interface CustomerData {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface CustomerQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}
