import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('🗄️ Database connected successfully');

    // 初始化默认分类数据
    await this.initializeDefaultCategories();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async initializeDefaultCategories() {
    try {
      // 检查是否已有默认分类
      const existingDefaultCategories = await this.category.count({
        where: { isDefault: true },
      });

      // 如果没有默认分类，插入默认分类
      if (existingDefaultCategories === 0) {
        const defaultCategories = [
          // 收入分类
          {
            name: '客户回款',
            type: 'income',
            icon: '💰',
            color: '#4CAF50',
            isDefault: true,
            sortOrder: 1,
          },
          {
            name: '现金收款',
            type: 'income',
            icon: '💵',
            color: '#8BC34A',
            isDefault: true,
            sortOrder: 2,
          },
          {
            name: '其他收款',
            type: 'income',
            icon: '📈',
            color: '#009688',
            isDefault: true,
            sortOrder: 3,
          },

          // 支出分类（7个固定分类）
          {
            name: '种子',
            type: 'expense',
            icon: '🌾',
            color: '#FFB703',
            isDefault: true,
            sortOrder: 1,
          },
          {
            name: '化肥',
            type: 'expense',
            icon: '🧪',
            color: '#219EBC',
            isDefault: true,
            sortOrder: 2,
          },
          {
            name: '农药',
            type: 'expense',
            icon: '🛡️',
            color: '#FB8500',
            isDefault: true,
            sortOrder: 3,
          },
          {
            name: '农机',
            type: 'expense',
            icon: '🚜',
            color: '#8E44AD',
            isDefault: true,
            sortOrder: 4,
          },
          {
            name: '农具',
            type: 'expense',
            icon: '🔧',
            color: '#E63946',
            isDefault: true,
            sortOrder: 5,
          },
          {
            name: '运输',
            type: 'expense',
            icon: '🚚',
            color: '#3F51B5',
            isDefault: true,
            sortOrder: 6,
          },
          {
            name: '其他农资',
            type: 'expense',
            icon: '📦',
            color: '#795548',
            isDefault: true,
            sortOrder: 7,
          },
        ];

        await this.category.createMany({
          data: defaultCategories,
        });

        console.log('✅ Default categories initialized successfully');
      }
    } catch (error) {
      console.error('❌ Error initializing default categories:', error);
    }
  }

  // 分类相关方法
  async getCategories(userId?: string) {
    return this.category.findMany({
      where: userId ? { userId } : { userId: null },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async getCategoryById(id: number, userId?: string) {
    return this.category.findFirst({
      where: {
        id,
        userId: userId || null,
      },
    });
  }

  async createCategory(data: {
    name: string;
    type: string;
    icon?: string;
    color?: string;
    userId?: string;
  }) {
    return this.category.create({
      data,
    });
  }

  async updateCategory(
    id: number,
    data: {
      name?: string;
      type?: string;
      icon?: string;
      color?: string;
    },
    userId?: string,
  ) {
    return this.category.update({
      where: {
        id,
        userId: userId || null,
      },
      data,
    });
  }

  async deleteCategory(id: number, userId?: string) {
    return this.category.delete({
      where: {
        id,
        userId: userId || null,
      },
    });
  }

  // 账单相关方法
  async getBills(userId: string) {
    return this.bill.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getBillById(id: number, userId: string) {
    return this.bill.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: true,
      },
    });
  }

  async createBill(data: {
    amount: number;
    type: string;
    description?: string;
    date: Date;
    categoryId?: number;
    userId: string;
  }) {
    return this.bill.create({
      data: {
        ...data,
        amount: data.amount,
      },
      include: {
        category: true,
      },
    });
  }

  async updateBill(
    id: number,
    data: {
      amount?: number;
      type?: string;
      description?: string;
      date?: Date;
      categoryId?: number;
    },
    userId: string,
  ) {
    return this.bill.update({
      where: {
        id,
        userId,
      },
      data,
      include: {
        category: true,
      },
    });
  }

  async deleteBill(id: number, userId: string) {
    return this.bill.delete({
      where: {
        id,
        userId,
      },
    });
  }

  // 统计相关方法
  async getStatistics(userId: string) {
    const where = { userId };

    const [incomeSum, expenseSum, billCount] = await Promise.all([
      this.bill.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true },
      }),
      this.bill.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
      }),
      this.bill.count({ where }),
    ]);

    const totalIncome = Number(incomeSum._sum.amount || 0);
    const totalExpense = Number(expenseSum._sum.amount || 0);

    return {
      data: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        billCount,
      },
      error: null,
    };
  }
}
