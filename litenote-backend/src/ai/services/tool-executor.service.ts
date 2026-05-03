import { Injectable, Logger } from '@nestjs/common';
import { BillsService } from '../../bills/bills.service';
import { CategoriesService } from '../../categories/categories.service';
import { CustomersService } from '../../customers/customers.service';

/**
 * 工具执行服务
 * 执行 AI 调用的工具，操作账单、分类和客户数据
 */
@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly billsService: BillsService,
    private readonly categoriesService: CategoriesService,
    private readonly customersService: CustomersService,
  ) {}

  /**
   * 执行工具调用
   */
  async executeTool(
    userId: string,
    toolName: string,
    args: Record<string, any>,
  ): Promise<{ success: boolean; data: any; message: string }> {
    this.logger.log(`执行工具: ${toolName}, 参数: ${JSON.stringify(args)}`);

    switch (toolName) {
      case 'create_bills':
        return this.executeCreateBills(userId, args);
      case 'query_bills':
        return this.executeQueryBills(userId, args);
      case 'delete_bills':
        return this.executeDeleteBills(userId, args);
      case 'get_statistics':
        return this.executeGetStatistics(userId, args);
      case 'query_customers':
        return this.executeQueryCustomers(userId, args);
      case 'settle_credits':
        return this.executeSettleCredits(userId, args);
      default:
        return {
          success: false,
          data: null,
          message: `未知工具: ${toolName}`,
        };
    }
  }

  /**
   * create_bills: 仅做数据补全（categoryName → categoryId, customerName → customerId），不入库
   * 返回补全后的账单数据，由前端展示和确认后手动保存
   */
  private async executeCreateBills(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const [categories, customers] = await Promise.all([
        this.categoriesService.findAll(userId),
        this.customersService.findAll(userId),
      ]);

      const bills = (args.bills || []).map((bill: any) => {
        const category = categories.find(
          (c) => c.name === bill.categoryName && c.type === bill.type,
        );

        // 查找客户
        let customerId: number | null = null;
        if (bill.customerName) {
          const customer = customers.find(
            (c) => c.name === bill.customerName,
          );
          customerId = customer?.id || null;
        }

        return {
          amount: Number(bill.amount),
          type: bill.type,
          description: bill.description || '',
          categoryName: bill.categoryName,
          categoryId: category?.id || null,
          categoryIcon: category?.icon || null,
          customerName: bill.customerName || null,
          customerId,
          date: bill.date,
        };
      });

      return {
        success: true,
        data: { bills },
        message: `识别到 ${bills.length} 条账单`,
      };
    } catch (error) {
      this.logger.error(`create_bills 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `创建账单失败: ${error.message}`,
      };
    }
  }

  /**
   * query_bills: 查询账单记录
   */
  private async executeQueryBills(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      let categoryId: number | undefined;
      let customerId: number | undefined;

      if (args.categoryName) {
        const categories = await this.categoriesService.findAll(userId);
        const cat = categories.find((c) => c.name === args.categoryName);
        categoryId = cat?.id;
      }

      if (args.customerName) {
        const customers = await this.customersService.findAll(userId);
        const customer = customers.find((c) => c.name === args.customerName);
        customerId = customer?.id;
      }

      const result = await this.billsService.findAll(userId, {
        startDate: args.startDate,
        endDate: args.endDate,
        type: args.type,
        categoryId,
        customerId,
        isSettled: args.isSettled,
        limit: Math.min(args.limit || 20, 50),
        page: 1,
        orderBy: 'date',
        orderDirection: 'desc',
      });

      return {
        success: true,
        data: result,
        message: `查询到 ${result.data.length} 条账单`,
      };
    } catch (error) {
      this.logger.error(`query_bills 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `查询账单失败: ${error.message}`,
      };
    }
  }

  /**
   * delete_bills: 删除账单
   */
  private async executeDeleteBills(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const results: { id: number; deleted: boolean; error?: string }[] = [];
      for (const id of args.billIds || []) {
        try {
          await this.billsService.remove(userId, id);
          results.push({ id, deleted: true });
        } catch (e) {
          results.push({ id, deleted: false, error: e.message });
        }
      }
      const successCount = results.filter((r) => r.deleted).length;
      return {
        success: true,
        data: { results, successCount },
        message: `成功删除 ${successCount} 条账单`,
      };
    } catch (error) {
      this.logger.error(`delete_bills 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `删除账单失败: ${error.message}`,
      };
    }
  }

  /**
   * get_statistics: 获取统计数据
   */
  private async executeGetStatistics(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const stats = await this.billsService.getStatistics(
        userId,
        args.startDate,
        args.endDate,
      );
      return {
        success: true,
        data: stats,
        message: '统计数据获取成功',
      };
    } catch (error) {
      this.logger.error(`get_statistics 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `获取统计失败: ${error.message}`,
      };
    }
  }

  /**
   * query_customers: 查询客户及其赊账状态
   */
  private async executeQueryCustomers(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const customers = await this.customersService.findAll(userId, {
        search: args.search,
      });

      // 如果需要包含未结算赊账信息
      if (args.includeUnsettled !== false && customers.length > 0) {
        const customerIds = customers.map((c) => c.id);
        const unsettledBills = await this.customersService.getUnsettledCredits(userId);

        // 按客户分组汇总未结算赊账
        const unsettledMap = new Map<number, { totalAmount: number; billCount: number }>();
        for (const bill of unsettledBills) {
          if (!bill.customerId) continue;
          const existing = unsettledMap.get(bill.customerId) || { totalAmount: 0, billCount: 0 };
          existing.totalAmount += bill.amount.toNumber();
          existing.billCount += 1;
          unsettledMap.set(bill.customerId, existing);
        }

        // 附加赊账信息到客户
        const customersWithCredits = customers.map((customer) => {
          const creditInfo = unsettledMap.get(customer.id);
          return {
            ...customer,
            unsettledCreditAmount: creditInfo?.totalAmount || 0,
            unsettledCreditCount: creditInfo?.billCount || 0,
          };
        });

        return {
          success: true,
          data: { customers: customersWithCredits },
          message: `查询到 ${customers.length} 个客户`,
        };
      }

      return {
        success: true,
        data: { customers },
        message: `查询到 ${customers.length} 个客户`,
      };
    } catch (error) {
      this.logger.error(`query_customers 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `查询客户失败: ${error.message}`,
      };
    }
  }

  /**
   * settle_credits: 结算赊账
   */
  private async executeSettleCredits(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const result = await this.billsService.settleBatch(userId, {
        billIds: args.billIds,
        paymentMethod: args.paymentMethod,
      });

      return {
        success: true,
        data: result,
        message: `成功结算 ${result.settledCount} 条赊账，合计 ${result.totalAmount} 元`,
      };
    } catch (error) {
      this.logger.error(`settle_credits 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `结算赊账失败: ${error.message}`,
      };
    }
  }
}
