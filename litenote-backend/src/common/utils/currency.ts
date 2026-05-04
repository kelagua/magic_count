/**
 * 货币工具 - 使用整数分运算避免浮点数精度问题
 * 所有金额在 API 层以"分"为单位返回（整数），前端显示时除以 100
 * 数据库仍使用 Decimal(15,4) 存储
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
 * 分（整数）→ 元（number，仅用于显示）
 * 例: 1050 分 → 10.50 元
 */
export function fenToYuan(fen: number): number {
  return fen / 100;
}

/**
 * 格式化分为元字符串
 * 例: 1050 → "10.50"
 */
export function formatFenToYuan(fen: number): string {
  return (fen / 100).toFixed(2);
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
