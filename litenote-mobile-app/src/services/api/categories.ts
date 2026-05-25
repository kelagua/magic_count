/**
 * 分类相关API服务
 */
import { httpService } from '../http';

export interface CategoryData {
  id: number;
  name: string;
  type: 'entry' | 'expense' | 'credit';
  icon?: string;
  color?: string;
  isDefault: boolean;
  sortOrder: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  type: 'entry' | 'expense' | 'credit';
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: 'entry' | 'expense' | 'credit';
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class CategoriesService {
  /**
   * 创建分类
   */
  async createCategory(data: CreateCategoryDto): Promise<ApiResponse<CategoryData>> {
    return httpService.post('/categories', data);
  }

  /**
   * 获取分类列表
   */
  async getCategories(type?: 'entry' | 'expense' | 'credit'): Promise<ApiResponse<CategoryData[]>> {
    const params = type ? { type } : {};
    return httpService.get('/categories', { params });
  }

  /**
   * 获取入账分类
   */
  async getEntryCategories(): Promise<ApiResponse<CategoryData[]>> {
    return this.getCategories('entry');
  }

  /**
   * 获取支出分类
   */
  async getExpenseCategories(): Promise<ApiResponse<CategoryData[]>> {
    return this.getCategories('expense');
  }

  /**
   * 获取分类详情
   */
  async getCategoryById(id: number): Promise<ApiResponse<CategoryData>> {
    return httpService.get(`/categories/${id}`);
  }

  /**
   * 更新分类
   */
  async updateCategory(id: number, data: UpdateCategoryDto): Promise<ApiResponse<CategoryData>> {
    return httpService.patch(`/categories/${id}`, data);
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: number): Promise<ApiResponse> {
    return httpService.delete(`/categories/${id}`);
  }

  /**
   * 初始化系统默认分类
   */
  async initDefaultCategories(): Promise<ApiResponse> {
    return httpService.post('/categories/init-defaults');
  }

  /**
   * 获取默认分类
   */
  async getDefaultCategories(): Promise<ApiResponse<CategoryData[]>> {
    const response = await this.getCategories();
    if (response.success && response.data) {
      const defaultCategories = response.data.filter(category => category.isDefault);
      return {
        ...response,
        data: defaultCategories,
      };
    }
    return response;
  }

  /**
   * 获取用户自定义分类
   */
  async getUserCategories(): Promise<ApiResponse<CategoryData[]>> {
    const response = await this.getCategories();
    if (response.success && response.data) {
      const userCategories = response.data.filter(category => !category.isDefault);
      return {
        ...response,
        data: userCategories,
      };
    }
    return response;
  }

  /**
   * 按类型分组获取分类
   */
  async getCategoriesByType(): Promise<{
    entry: CategoryData[];
    expense: CategoryData[];
  }> {
    const response = await this.getCategories();
    const categories = response.data || [];

    return {
      entry: categories.filter(cat => cat.type === 'entry'),
      expense: categories.filter(cat => cat.type === 'expense'),
    };
  }
}

export const categoriesService = new CategoriesService();
