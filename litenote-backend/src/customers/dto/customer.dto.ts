import {
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: '客户名称',
    example: '张三',
    maxLength: 100,
  })
  @IsNotEmpty({ message: '客户名称不能为空' })
  @IsString({ message: '客户名称必须是字符串' })
  @MaxLength(100, { message: '客户名称长度不能超过100个字符' })
  name: string;

  @ApiProperty({
    description: '电话',
    example: '13800138000',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: '电话必须是字符串' })
  @MaxLength(20, { message: '电话长度不能超过20个字符' })
  phone?: string;

  @ApiProperty({
    description: '地址',
    example: '某某村',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '地址必须是字符串' })
  address?: string;

  @ApiProperty({
    description: '备注',
    example: '老客户',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiProperty({
    description: '客户名称',
    example: '张三',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: '客户名称必须是字符串' })
  @MaxLength(100, { message: '客户名称长度不能超过100个字符' })
  name?: string;

  @ApiProperty({
    description: '电话',
    example: '13800138000',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: '电话必须是字符串' })
  @MaxLength(20, { message: '电话长度不能超过20个字符' })
  phone?: string;

  @ApiProperty({
    description: '地址',
    example: '某某村',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '地址必须是字符串' })
  address?: string;

  @ApiProperty({
    description: '备注',
    example: '老客户',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  notes?: string;
}

export class QueryCustomerDto {
  @ApiProperty({
    description: '搜索关键词（按名称或电话模糊搜索）',
    example: '张',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;
}
