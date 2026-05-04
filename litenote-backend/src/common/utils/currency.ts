/**
 * 货币工具 - 使用整数分运算避免浮点数精度问题
 *
 * 金额约定（方案 B — 全链路一致）：
 * - 数据库使用 Decimal(15,4) 存储，单位为"元"
 * - API 响应中金额一律以"元"为单位返回（number，保留2位小数）
 * - 统计汇总等需要累加运算时，先转为整数"分"（yuanToFen）累加，再转回元（fenToYuan）返回
 * - CRUD 操作返回的 Prisma 对象中 amount 为 Decimal，序列化时自动转为 number（元）
 * - 前端显示时直接使用返回的元值，无需任何换算
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * 元（Decimal/number/string）→ 分（整数）
 * 例: 10.50 元 → 1050 分
 */
export function yuanToFen(amount: Decimal | number | string | null | undefined): number {
  if (amount === null || amount === undefined) return 0;
  const decimal = new Decimal(amount);
  return decimal.mul(100).toNumber();
}

/**
 * 分（整数）→ 元（number，保留2位小数）
 * 使用 Decimal 运算避免浮点精度问题
 * 例: 1050 分 → 10.50
 */
export function fenToYuan(fen: number): number {
  return new Decimal(fen).div(100).toNumber();
}

/**
 * 格式化分为元字符串
 * 例: 1050 → "10.50"
 */
export function formatFenToYuan(fen: number): string {
  return new Decimal(fen).div(100).toFixed(2);
}

/**
 * 安全的金额加法（分单位，整数运算）
 */
export function addFen(a: number, b: number): number {
  return a + b;
}

/**
 * 安全的金额减法（分单位，整数运算）
 */
export function subtractFen(a: number, b: number): number {
  return a - b;
}
