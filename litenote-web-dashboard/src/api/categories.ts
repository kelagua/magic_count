import client from './client';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ApiResponse,
} from '../types';

export const categoriesApi = {
  getCategories: async (params?: { type?: string }): Promise<ApiResponse<Category[]>> => {
    const res = await client.get('/categories', { params });
    return res.data;
  },

  getCategory: async (id: number): Promise<ApiResponse<Category>> => {
    const res = await client.get(`/categories/${id}`);
    return res.data;
  },

  createCategory: async (data: CreateCategoryRequest): Promise<ApiResponse<Category>> => {
    const res = await client.post('/categories', data);
    return res.data;
  },

  updateCategory: async (id: number, data: UpdateCategoryRequest): Promise<ApiResponse<Category>> => {
    const res = await client.patch(`/categories/${id}`, data);
    return res.data;
  },

  deleteCategory: async (id: number): Promise<ApiResponse> => {
    const res = await client.delete(`/categories/${id}`);
    return res.data;
  },
};
