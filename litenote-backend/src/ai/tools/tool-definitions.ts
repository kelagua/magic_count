import { ToolDefinition } from '../types/chat.types';

/**
 * AI 可调用的工具定义
 * 遵循 JSON Schema 格式，兼容 Claude 和 OpenAI
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'create_bills',
    description:
      '识别并创建账单记录。当用户提到了农资入账、客户结清或支出，且信息足够完整（至少有金额）时调用此工具。如果用户没有指定日期，使用今天的日期。如果用户没有明确指定分类，根据描述自动推断最合适的分类。如果用户提到了入账或结清，type 使用 entry 或 settlement，并填写 customerName。',
    parameters: {
      type: 'object',
      properties: {
        bills: {
          type: 'array',
          description: '识别到的账单列表',
          items: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
                description: '金额，正数',
              },
              type: {
                type: 'string',
                enum: ['entry', 'settlement', 'expense'],
                description: '类型：entry=入账, settlement=结清, expense=支出',
              },
              description: {
                type: 'string',
                description: '简短描述，10字以内',
              },
              categoryName: {
                type: 'string',
                description: '分类名称，必须从用户可用的分类中选择',
              },
              date: {
                type: 'string',
                description: '日期，YYYY-MM-DD 格式',
              },
              customerName: {
                type: 'string',
                description: '客户名称（入账/结清时必填，结清时选填）',
              },
            },
            required: ['amount', 'type', 'description', 'categoryName', 'date'],
          },
        },
      },
      required: ['bills'],
    },
  },
  {
    name: 'query_bills',
    description:
      '查询用户的账单记录。当用户想查看、搜索或了解某段时间内的入账、结清或客户往来时调用。',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: '开始日期，YYYY-MM-DD 格式',
        },
        endDate: {
          type: 'string',
          description: '结束日期，YYYY-MM-DD 格式',
        },
        type: {
          type: 'string',
          enum: ['entry', 'settlement', 'expense'],
          description: '筛选类型，不传则返回全部',
        },
        categoryName: {
          type: 'string',
          description: '按分类名称筛选',
        },
        customerName: {
          type: 'string',
          description: '按客户名称筛选',
        },
        isSettled: {
          type: 'boolean',
          description: '是否已结清（筛选入账的结清状态），不传则返回全部',
        },
        limit: {
          type: 'number',
          description: '返回数量限制，默认20，最大50',
        },
      },
    },
  },
  {
    name: 'delete_bills',
    description:
      '删除指定的账单记录。需要提供要删除的账单ID列表。只有在用户明确要求删除时才调用此工具。',
    parameters: {
      type: 'object',
      properties: {
        billIds: {
          type: 'array',
          items: { type: 'number' },
          description: '要删除的账单ID列表',
        },
      },
      required: ['billIds'],
    },
  },
  {
    name: 'get_statistics',
    description:
      '获取用户的账单统计信息，包括入账总额、结清总额、分类占比、趋势等。当用户询问统计、趋势、分析、总结等问题时调用。',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: '统计开始日期，YYYY-MM-DD 格式',
        },
        endDate: {
          type: 'string',
          description: '统计结束日期，YYYY-MM-DD 格式',
        },
      },
    },
  },
  {
    name: 'query_customers',
    description:
      '查询客户信息及其入账状态。当用户想查看客户列表、搜索客户、了解某客户的入账情况时调用。',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: '搜索关键词（按名称或电话模糊搜索）',
        },
        includeUnsettled: {
          type: 'boolean',
          description: '是否包含该客户的未结清入账信息，默认true',
        },
      },
    },
  },
  {
    name: 'settle_credits',
    description:
      '结清入账记录。当用户表示要还款、结清入账时调用此工具。需要提供要结清的账单ID列表。',
    parameters: {
      type: 'object',
      properties: {
        billIds: {
          type: 'array',
          items: { type: 'number' },
          description: '要结清的入账账单ID列表',
        },
        paymentMethod: {
          type: 'string',
          description: '还款方式，如：现金、微信、银行卡等',
        },
      },
      required: ['billIds'],
    },
  },
];
