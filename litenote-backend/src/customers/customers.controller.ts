import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  QueryCustomerDto,
} from './dto/customer.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * 创建客户
   * POST /customers
   */
  @ApiOperation({
    summary: '创建客户',
    description: '创建一个新的客户',
  })
  @ApiResponse({ status: 201, description: '客户创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    try {
      const result = await this.customersService.create(userId, createCustomerDto);

      return {
        success: true,
        message: '客户创建成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '创建客户失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取客户列表
   * GET /customers
   */
  @ApiOperation({
    summary: '获取客户列表',
    description: '获取用户的客户列表，支持搜索',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '搜索关键词（按名称或电话模糊搜索）',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryCustomerDto,
  ) {
    try {
      const result = await this.customersService.findAll(userId, query);

      return {
        success: true,
        message: '获取客户列表成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取客户列表失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取客户详情
   * GET /customers/:id
   */
  @ApiOperation({
    summary: '获取客户详情',
    description: '根据ID获取客户的详细信息',
  })
  @ApiParam({ name: 'id', description: '客户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '客户不存在' })
  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const result = await this.customersService.findOne(userId, id);

      return {
        success: true,
        message: '获取客户详情成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取客户详情失败',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * 获取客户的账单记录
   * GET /customers/:id/bills
   */
  @ApiOperation({
    summary: '获取客户的账单记录',
    description: '获取指定客户的所有账单记录，包括赊账和回款',
  })
  @ApiParam({ name: 'id', description: '客户ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'type', required: false, description: '账单类型' })
  @ApiQuery({ name: 'isSettled', required: false, description: '是否已结算' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '客户不存在' })
  @Get(':id/bills')
  async getBillsByCustomer(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('isSettled') isSettled?: string,
  ) {
    try {
      const result = await this.customersService.getBillsByCustomer(userId, id, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        type: type || undefined,
        isSettled: isSettled === 'true' ? true : isSettled === 'false' ? false : undefined,
      });

      return {
        success: true,
        message: '获取客户账单成功',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取客户账单失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 更新客户
   * PATCH /customers/:id
   */
  @ApiOperation({ summary: '更新客户', description: '根据ID更新客户信息' })
  @ApiParam({ name: 'id', description: '客户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '客户不存在' })
  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    try {
      const result = await this.customersService.update(userId, id, updateCustomerDto);

      return {
        success: true,
        message: '客户更新成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '更新客户失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 删除客户
   * DELETE /customers/:id
   */
  @ApiOperation({ summary: '删除客户', description: '根据ID删除客户' })
  @ApiParam({ name: 'id', description: '客户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '客户不存在' })
  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      await this.customersService.remove(userId, id);

      return {
        success: true,
        message: '客户删除成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '删除客户失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
