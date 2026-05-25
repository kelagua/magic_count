import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 创建客户
   */
  async create(userId: string, createCustomerDto: CreateCustomerDto) {
    const { name, phone, address, notes } = createCustomerDto;

    return this.prisma.customer.create({
      data: {
        name,
        phone,
        address,
        notes,
        userId,
      },
    });
  }

  /**
   * 获取客户列表
   */
  async findAll(userId: string, query?: QueryCustomerDto) {
    const where: any = { userId };

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取客户详情
   */
  async findOne(userId: string, id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, userId },
    });

    if (!customer) {
      throw new Error('客户不存在');
    }

    return customer;
  }

  /**
   * 更新客户
   */
  async update(userId: string, id: number, updateCustomerDto: UpdateCustomerDto) {
    // 先检查客户是否存在且属于该用户
    await this.findOne(userId, id);

    const updateData: any = {};

    if (updateCustomerDto.name !== undefined) {
      updateData.name = updateCustomerDto.name;
    }
    if (updateCustomerDto.phone !== undefined) {
      updateData.phone = updateCustomerDto.phone;
    }
    if (updateCustomerDto.address !== undefined) {
      updateData.address = updateCustomerDto.address;
    }
    if (updateCustomerDto.notes !== undefined) {
      updateData.notes = updateCustomerDto.notes;
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 删除客户
   */
  async remove(userId: string, id: number) {
    // 先检查客户是否存在且属于该用户
    await this.findOne(userId, id);

    return this.prisma.customer.delete({
      where: { id },
    });
  }

  /**
   * 获取客户的账单记录
   */
  async getBillsByCustomer(
    userId: string,
    customerId: number,
    query?: { page?: number; limit?: number; type?: string; isSettled?: boolean },
  ) {
    // 先检查客户是否存在且属于该用户
    await this.findOne(userId, customerId);

    const { page = 1, limit = 20, type, isSettled } = query || {};
    const skip = (page - 1) * limit;

    const where: any = { userId, customerId };

    if (type) {
      where.type = type;
    }
    if (isSettled !== undefined) {
      where.isSettled = isSettled;
    }

    const [bills, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        include: {
          category: true,
          customer: true,
        },
        orderBy: { date: 'desc' },
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
   * 获取未结清的入账记录
   */
  async getUnsettledCredits(userId: string, customerId?: number) {
    const where: any = { userId, type: 'entry', isSettled: false };

    if (customerId) {
      where.customerId = customerId;
    }

    return this.prisma.bill.findMany({
      where,
      include: {
        customer: true,
        category: true,
      },
      orderBy: { date: 'desc' },
    });
  }
}
