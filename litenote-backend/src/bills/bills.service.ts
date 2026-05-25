import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBillWithUserDto,
  UpdateBillDto,
  BillQueryDto,
  SettleBatchDto,
} from './dto/bill.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';
import { yuanToFen, fenToYuan } from '../common/utils/currency';

/**
 * 金额约定（方案 B — 全链路一致）：
 * - 数据库使用 Decimal(15,4) 存储，单位为"元"
 * - API 响应中金额一律以"元"为单位返回（number，保留2位小数）
 * - 统计汇总等需要累加运算时，先转为整数"分"（yuanToFen）累加，再转回元（fenToYuan）返回
 * - CRUD 操作返回的 Prisma 对象中 amount 为 Decimal，序列化时自动转为 number（元）
 * - 前端显示时直接使用返回的元值，无需任何换算
 */

@Injectable()
export class BillsService {
  private readonly logger = new Logger(BillsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 创建账单
   */
  async create(userId: string, createBillDto: CreateBillWithUserDto) {
    const { amount, type, description, date, categoryId, customerId, relatedEntryIds } = createBillDto;

    // 验证用户存在（JWT guard 已确保认证，此处仅做数据完整性校验）
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new BadRequestException('用户不存在');
    }

    // 入账类型必须关联客户
    if (type === 'entry' && !customerId) {
      throw new BadRequestException('入账类型必须关联客户');
    }

    // 结清类型必须关联客户且有关联的入账记录
    if (type === 'settlement') {
      if (!customerId) {
        throw new BadRequestException('结清类型必须关联客户');
      }
      if (!relatedEntryIds || relatedEntryIds.length === 0) {
        throw new BadRequestException('结清类型必须关联至少一个入账记录');
      }
    }

    return this.prisma.bill.create({
      data: {
        amount: new Decimal(amount),
        type,
        description,
        date: new Date(date),
        categoryId,
        customerId,
        userId,
        relatedEntryIds,
      },
      include: {
        category: true,
        customer: true,
      },
    });
  }

  // ensureUserExists 已移除 — JWT guard 确保用户已通过认证，不再自动创建硬编码用户

  /**
   * 获取用户的账单列表
   */
  async findAll(userId: string, query: BillQueryDto) {
    const {
      page = 1,
      limit = 20,
      type,
      categoryId,
      customerId,
      isSettled,
      startDate,
      endDate,
      orderBy = 'date',
      orderDirection = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (isSettled !== undefined) {
      where.isSettled = isSettled;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const [bills, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        include: {
          category: true,
          customer: true,
        },
        orderBy: {
          [orderBy]: orderDirection,
        },
        skip,
        take: limit,
      }),
      this.prisma.bill.count({ where }),
    ]);

    return {
      data: bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取单个账单详情
   */
  async findOne(userId: string, id: number) {
    const bill = await this.prisma.bill.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: true,
        customer: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('账单不存在');
    }

    return bill;
  }

  /**
   * 更新账单
   */
  async update(userId: string, id: number, updateBillDto: UpdateBillDto) {
    // 先检查账单是否存在且属于该用户
    await this.findOne(userId, id);

    const updateData: any = {};

    if (updateBillDto.amount !== undefined) {
      updateData.amount = new Decimal(updateBillDto.amount);
    }
    if (updateBillDto.type !== undefined) {
      updateData.type = updateBillDto.type;
    }
    if (updateBillDto.description !== undefined) {
      updateData.description = updateBillDto.description;
    }
    if (updateBillDto.date !== undefined) {
      updateData.date = new Date(updateBillDto.date);
    }
    if (updateBillDto.categoryId !== undefined) {
      updateData.categoryId = updateBillDto.categoryId;
    }
    if (updateBillDto.customerId !== undefined) {
      updateData.customerId = updateBillDto.customerId;
    }

    return this.prisma.bill.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        customer: true,
      },
    });
  }

  /**
   * 删除账单
   */
  async remove(userId: string, id: number) {
    // 先检查账单是否存在且属于该用户
    await this.findOne(userId, id);

    return this.prisma.bill.delete({
      where: { id },
    });
  }

  /**
   * 获取用户的账单统计信息
   */
  async getStatistics(userId: string, startDate?: string, endDate?: string, granularity?: 'daily' | 'monthly') {
    this.logger.log(`[getStatistics] 开始查询统计数据 - userId: ${userId}, startDate: ${startDate}, endDate: ${endDate}, granularity: ${granularity}`);

    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    this.logger.log(`[getStatistics] 查询条件: ${JSON.stringify(where)}`);

    // 获取总体统计
    const [entryStats, settlementStats, expenseStats] = await Promise.all([
      this.prisma.bill.aggregate({
        where: { ...where, type: 'entry' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.bill.aggregate({
        where: { ...where, type: 'settlement' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.bill.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    this.logger.log(`[getStatistics] 入账统计: count=${entryStats._count}, sum=${entryStats._sum.amount}`);
    this.logger.log(`[getStatistics] 结清统计: count=${settlementStats._count}, sum=${settlementStats._sum.amount}`);
    this.logger.log(`[getStatistics] 支出统计: count=${expenseStats._count}, sum=${expenseStats._sum.amount}`);

    // 获取支出分类统计
    const expenseCategoryStats = await this.prisma.bill.groupBy({
      by: ['categoryId'],
      where: { ...where, type: 'expense' },
      _sum: { amount: true },
      _count: true,
    });

    // 获取入账分类统计（商品分类）
    const entryCategoryStats = await this.prisma.bill.groupBy({
      by: ['categoryId'],
      where: { ...where, type: 'entry' },
      _sum: { amount: true },
      _count: true,
    });

    // 获取所有相关分类详细信息（过滤掉未分类的 null 值）
    const allCategoryIds = [
      ...expenseCategoryStats.map((stat) => stat.categoryId),
      ...entryCategoryStats.map((stat) => stat.categoryId),
    ].filter((id): id is number => id !== null);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: allCategoryIds } },
      select: { id: true, name: true, icon: true },
    });

    // 组装支出分类统计数据（内部用分计算百分比，返回值转回元）
    const totalExpenseAmount = expenseStats._sum.amount || new Decimal(0);
    const totalExpenseAmountFen = yuanToFen(totalExpenseAmount);
    const expenseCategoryData = expenseCategoryStats
      .map((stat) => {
        const category = categories.find((c) => c.id === stat.categoryId);
        const amountFen = yuanToFen(stat._sum.amount);
        const percentage =
          totalExpenseAmountFen > 0
            ? (amountFen / totalExpenseAmountFen) * 100
            : 0;

        return {
          categoryId: stat.categoryId,
          categoryName: category?.name || '未分类',
          categoryIcon: category?.icon || '📊',
          amount: fenToYuan(amountFen),
          percentage: parseFloat(percentage.toFixed(1)),
          count: stat._count,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // 组装入账分类统计数据（内部用分计算百分比，返回值转回元）
    const totalEntryAmount = entryStats._sum.amount || new Decimal(0);
    const totalEntryAmountFen = yuanToFen(totalEntryAmount);
    const entryCategoryData = entryCategoryStats
      .map((stat) => {
        const category = categories.find((c) => c.id === stat.categoryId);
        const amountFen = yuanToFen(stat._sum.amount);
        const percentage =
          totalEntryAmountFen > 0
            ? (amountFen / totalEntryAmountFen) * 100
            : 0;

        return {
          categoryId: stat.categoryId,
          categoryName: category?.name || '未分类',
          categoryIcon: category?.icon || '💰',
          amount: fenToYuan(amountFen),
          percentage: parseFloat(percentage.toFixed(1)),
          count: stat._count,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // 获取月度趋势数据 - 根据 granularity 参数或日期范围自动判断
    const monthlyTrends = [];

    // 计算查询日期范围
    const startDateObj = startDate ? new Date(startDate) : new Date();
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

    // 决定是否返回月度趋势：显式指定 granularity=monthly 或自动判断 >90 天
    const shouldReturnMonthly = granularity === 'monthly' || (!granularity && daysDiff > 90);
    if (shouldReturnMonthly) {
      const monthStart = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
      const monthEnd = new Date(endDateObj.getFullYear(), endDateObj.getMonth() + 1, 0, 23, 59, 59);

      // 一次性查询日期范围内的所有账单
      const monthlyBills = await this.prisma.bill.findMany({
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          date: true,
          type: true,
          amount: true,
        },
      });

      // 在应用层按月份分组（使用分单位累加，避免浮点精度问题）
      const monthlyMap = new Map<string, { entryFen: number; settlementFen: number; expenseFen: number }>();

      monthlyBills.forEach((bill) => {
        const date = new Date(bill.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { entryFen: 0, settlementFen: 0, expenseFen: 0 });
        }
        const monthData = monthlyMap.get(monthKey)!;
        if (bill.type === 'entry') {
          monthData.entryFen += yuanToFen(bill.amount);
        } else if (bill.type === 'settlement') {
          monthData.settlementFen += yuanToFen(bill.amount);
        } else {
          monthData.expenseFen += yuanToFen(bill.amount);
        }
      });

      // 生成完整的月份序列（从 startDate 到 endDate），金额转回元
      const currentMonth = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
      const endMonth = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1);

      while (currentMonth <= endMonth) {
        const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}`;
        const monthData = monthlyMap.get(monthKey) || { entryFen: 0, settlementFen: 0, expenseFen: 0 };

        monthlyTrends.push({
          month: `${currentMonth.getMonth() + 1}月`,
          year: currentMonth.getFullYear(),
          entry: fenToYuan(monthData.entryFen),
          settlement: fenToYuan(monthData.settlementFen),
          expense: fenToYuan(monthData.expenseFen),
        });

        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
    }

    // 获取每日趋势数据 - 根据 granularity 参数或日期范围自动判断
    const dailyTrends = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      this.logger.log(`[getStatistics] 计算每日趋势 - 天数差: ${daysDiff}`);

      // 决定是否返回每日趋势：显式指定 granularity=daily 或自动判断 ≤90 天（且未指定 monthly）
      const shouldReturnDaily = granularity === 'daily' || (!granularity && daysDiff <= 90);
      // 上限放宽到 366 天（支持全年每日数据）
      if (shouldReturnDaily && daysDiff <= 366) {
        // 一次性查询所有账单数据
        const bills = await this.prisma.bill.findMany({
          where,
          select: {
            date: true,
            type: true,
            amount: true,
          },
        });

        // 在应用层按日期分组（使用分单位累加，避免浮点精度问题）
        const dailyMap = new Map<string, { entryFen: number; settlementFen: number; expenseFen: number }>();

        bills.forEach((bill) => {
          const dateKey = bill.date.toISOString().split('T')[0];
          if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, { entryFen: 0, settlementFen: 0, expenseFen: 0 });
          }
          const dayData = dailyMap.get(dateKey)!;
          if (bill.type === 'entry') {
            dayData.entryFen += yuanToFen(bill.amount);
          } else if (bill.type === 'settlement') {
            dayData.settlementFen += yuanToFen(bill.amount);
          } else {
            dayData.expenseFen += yuanToFen(bill.amount);
          }
        });

        // 生成完整的日期序列（包括没有数据的日期），金额转回元
        for (let i = 0; i <= daysDiff; i++) {
          const dayDate = new Date(start);
          dayDate.setDate(start.getDate() + i);
          const dateKey = dayDate.toISOString().split('T')[0];
          const dayData = dailyMap.get(dateKey) || { entryFen: 0, settlementFen: 0, expenseFen: 0 };

          dailyTrends.push({
            date: dateKey,
            entry: fenToYuan(dayData.entryFen),
            settlement: fenToYuan(dayData.settlementFen),
            expense: fenToYuan(dayData.expenseFen),
          });
        }

        this.logger.log(`[getStatistics] 每日趋势数据生成完成 - 共 ${dailyTrends.length} 天`);
      } else if (shouldReturnDaily) {
        this.logger.warn(`[getStatistics] 天数差超过366天，跳过每日趋势计算`);
      }
    } else {
      this.logger.log(`[getStatistics] 未提供日期范围，跳过每日趋势计算`);
    }

    const totalEntry = entryStats._sum.amount || new Decimal(0);
    const totalSettlement = settlementStats._sum.amount || new Decimal(0);
    const totalExpense = expenseStats._sum.amount || new Decimal(0);

    const result = {
      // 总体统计（金额单位：元）
      // fenToYuan(yuanToFen(...)) 并非冗余：将 Decimal 四舍五入到"分"精度再转回元，
      // 确保金额精度到分（截断第3-4位小数），符合财务系统惯例
      totalEntry: fenToYuan(yuanToFen(totalEntry)),
      totalSettlement: fenToYuan(yuanToFen(totalSettlement)),
      totalExpense: fenToYuan(yuanToFen(totalExpense)),
      entryCount: entryStats._count,
      settlementCount: settlementStats._count,
      expenseCount: expenseStats._count,
      // 分类统计（用于饼图和分类占比）
      expenseCategoryStats: expenseCategoryData,
      entryCategoryStats: entryCategoryData,
      // 月度趋势（用于折线图）
      monthlyTrends,
      // 每日趋势（用于日趋势图）
      dailyTrends,
    };

    this.logger.log(`[getStatistics] 统计完成 - 入账: ${result.totalEntry}, 结清: ${result.totalSettlement}, 支出: ${result.totalExpense}, 每日趋势: ${dailyTrends.length}条`);

    return result;
  }

  /**
   * 批量结清入账
   */
  async settleBatch(userId: string, dto: SettleBatchDto) {
    const { billIds, paymentMethod } = dto;
    const now = new Date();

    // 使用事务确保原子性：创建 settlement 记录 + 更新 entry 的 isSettled
    return this.prisma.$transaction(async (tx) => {
      // 验证所有账单都属于该用户且是未结清的 entry 类型（在事务内查询，防止并发修改）
      const bills = await tx.bill.findMany({
        where: {
          id: { in: billIds },
          userId,
          type: 'entry',
          isSettled: false,
        },
      });

      if (bills.length === 0) {
        throw new BadRequestException('没有可结清的入账记录');
      }

      if (bills.length !== billIds.length) {
        const foundIds = bills.map((b) => b.id);
        const invalidIds = billIds.filter((id) => !foundIds.includes(id));
        this.logger.warn(
          `部分账单不可结清: ${invalidIds.join(', ')}（可能不存在、非入账类型或已结清）`,
        );
      }

      const settledBillIds = bills.map((b) => b.id);

      // 使用整数分累加，再转回元返回
      const totalAmountFen = bills.reduce(
        (sum, bill) => sum + yuanToFen(bill.amount),
        0,
      );

      // 创建 settlement 记录
      const settlement = await tx.bill.create({
        data: {
          amount: new Decimal(fenToYuan(totalAmountFen)),
          type: 'settlement',
          description: paymentMethod ? `结清 ${settledBillIds.length} 笔入账（${paymentMethod}）` : `结清 ${settledBillIds.length} 笔入账`,
          date: now,
          customerId: bills[0].customerId,
          userId,
          relatedEntryIds: settledBillIds,
        },
        include: {
          customer: true,
        },
      });

      // 批量更新对应 entry 的 isSettled=true, settledAt=now
      await tx.bill.updateMany({
        where: {
          id: { in: settledBillIds },
        },
        data: {
          isSettled: true,
          settledAt: now,
        },
      });

      return {
        settlement,
        settledCount: settledBillIds.length,
        totalAmount: fenToYuan(totalAmountFen),
      };
    });
  }

  /**
   * 获取首页统计数据
   */
  async getHomeStatistics(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 并行查询各项数据
    const [
      unsettledEntries,
      monthEntry,
      monthSettlement,
      monthExpense,
      totalRevenue,
      recentBills,
      topDebtors,
    ] = await Promise.all([
      // 1. 未结清入账总额（全部，不限月份）
      this.prisma.bill.aggregate({
        where: {
          userId,
          type: 'entry',
          isSettled: false,
        },
        _sum: { amount: true },
        _count: true,
      }),

      // 2. 本月入账（新增的入账金额）
      this.prisma.bill.aggregate({
        where: {
          userId,
          type: 'entry',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),

      // 3. 本月结清（settlement 类型，date 在本月）
      this.prisma.bill.aggregate({
        where: {
          userId,
          type: 'settlement',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),

      // 4. 本月支出
      this.prisma.bill.aggregate({
        where: {
          userId,
          type: 'expense',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),

      // 5. 本月营业额（所有 entry 合计，包括已结清和未结清）
      this.prisma.bill.aggregate({
        where: {
          userId,
          type: 'entry',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),

      // 6. 最近5条账单
      this.prisma.bill.findMany({
        where: { userId },
        include: {
          category: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // 7. 欠款最多的客户（未结算赊账）
      this.getTopDebtors(userId),
    ]);

    return {
      totalRevenue: fenToYuan(yuanToFen(totalRevenue._sum.amount)), // 本月营业额（entry 合计）
      monthlyEntry: fenToYuan(yuanToFen(monthEntry._sum.amount)),    // 本月入账
      monthlySettled: fenToYuan(yuanToFen(monthSettlement._sum.amount)), // 本月结清
      monthlyExpense: fenToYuan(yuanToFen(monthExpense._sum.amount)), // 本月支出
      unsettledAmount: fenToYuan(yuanToFen(unsettledEntries._sum.amount)), // 未结清总额
      unsettledCount: unsettledEntries._count, // 未结清笔数
      recentBills,
      topDebtors,
    };
  }

  /**
   * 获取欠款最多的客户列表
   */
  private async getTopDebtors(userId: string, limit: number = 5) {
    // 查询未结清的入账，按客户分组
    const unsettledBills = await this.prisma.bill.findMany({
      where: {
        userId,
        type: 'entry',
        isSettled: false,
        customerId: { not: null },
      },
      select: {
        customerId: true,
        amount: true,
      },
    });

    // 按客户分组汇总（使用分单位累加，避免浮点精度问题）
    const debtorMap = new Map<number, { totalAmountFen: number; billCount: number }>();
    for (const bill of unsettledBills) {
      if (!bill.customerId) continue;
      const existing = debtorMap.get(bill.customerId) || { totalAmountFen: 0, billCount: 0 };
      existing.totalAmountFen += yuanToFen(bill.amount);
      existing.billCount += 1;
      debtorMap.set(bill.customerId, existing);
    }

    // 排序取 top N
    const sortedDebtors = Array.from(debtorMap.entries())
      .sort((a, b) => b[1].totalAmountFen - a[1].totalAmountFen)
      .slice(0, limit);

    if (sortedDebtors.length === 0) {
      return [];
    }

    // 查询客户详情
    const customerIds = sortedDebtors.map(([id]) => id);
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, phone: true },
    });

    return sortedDebtors.map(([customerId, data]) => {
      const customer = customers.find((c) => c.id === customerId);
      return {
        customerId,
        customerName: customer?.name || '未知客户',
        customerPhone: customer?.phone || null,
        totalAmount: fenToYuan(data.totalAmountFen),
        billCount: data.billCount,
      };
    });
  }
}
