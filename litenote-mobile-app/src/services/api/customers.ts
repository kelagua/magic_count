/**
 * 客户相关API服务
 */
import { httpService } from '../http';
import type {
  CustomerData,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryParams,
} from '../../types/customer';
import type { ApiResponse, PaginatedResponse } from '../../types/api';
import type { BillData, BillQueryParams } from '../../types/bill';

class CustomersService {
  /**
   * 获取客户列表
   */
  async getCustomers(params?: CustomerQueryParams): Promise<PaginatedResponse<CustomerData>> {
    return httpService.get('/customers', { params }) as Promise<PaginatedResponse<CustomerData>>;
  }

  /**
   * 获取客户详情
   */
  async getCustomer(id: number): Promise<ApiResponse<CustomerData>> {
    return httpService.get(`/customers/${id}`);
  }

  /**
   * 创建客户
   */
  async createCustomer(data: CreateCustomerDto): Promise<ApiResponse<CustomerData>> {
    return httpService.post('/customers', data);
  }

  /**
   * 更新客户
   */
  async updateCustomer(id: number, data: UpdateCustomerDto): Promise<ApiResponse<CustomerData>> {
    return httpService.patch(`/customers/${id}`, data);
  }

  /**
   * 删除客户
   */
  async deleteCustomer(id: number): Promise<ApiResponse> {
    return httpService.delete(`/customers/${id}`);
  }

  /**
   * 获取客户的账单列表
   */
  async getCustomerBills(id: number, params?: BillQueryParams): Promise<PaginatedResponse<BillData>> {
    return httpService.get(`/customers/${id}/bills`, { params }) as Promise<PaginatedResponse<BillData>>;
  }
}

export const customersService = new CustomersService();
