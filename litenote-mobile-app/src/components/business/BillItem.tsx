/**
 * 账单项组件 - Neo-Brutalism 风格
 * 描边卡片 + Courier 金额（列表用，无实心阴影）
 * 支持赊账(credit)类型，显示客户名和结清状态
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth } from '../../theme';
import { useStyles } from '../../hooks';
import type { BillType } from '../../types/bill';

export interface BillItemData {
  id: string;
  category: string;
  amount: number;
  type: BillType;
  date: string;
  description?: string;
  icon: string;
  customerName?: string;
  isSettled?: boolean;
}

interface BillItemProps {
  bill: BillItemData;
  onPress?: (bill: BillItemData) => void;
}

const BillItem: React.FC<BillItemProps> = ({ bill, onPress }) => {
  const styles = useStyles(createStyles);

  const handlePress = () => {
    onPress?.(bill);
  };

  const isIncome = bill.type === 'income';
  const isCredit = bill.type === 'credit';

  // 根据类型选择图标背景色
  const getIconBgColor = () => {
    if (isCredit) return styles._colors.warning;
    if (isIncome) return styles._colors.success;
    return styles._colors.accent;
  };

  // 根据类型选择金额显示
  const getAmountPrefix = () => {
    if (isIncome) return '+';
    return '-';
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.8}
    >
      <View style={styles.leftSection}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getIconBgColor() },
        ]}>
          <Text style={styles.icon}>{bill.icon}</Text>
        </View>
        <View style={styles.billInfo}>
          <Text style={styles.category}>{bill.category}</Text>
          <Text style={styles.date}>{bill.date}</Text>
          {bill.description && (
            <Text style={styles.description} numberOfLines={1}>
              {bill.description}
            </Text>
          )}
          {/* 赊账类型显示客户名 */}
          {isCredit && bill.customerName && (
            <Text style={styles.customerName}>👤 {bill.customerName}</Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={[
          styles.amountBadge,
          isIncome ? styles.incomeBadge : isCredit ? styles.creditBadge : styles.expenseBadge,
        ]}>
          <Text style={[
            styles.amount,
            isIncome ? styles.incomeAmount : isCredit ? styles.creditAmount : styles.expenseAmount,
          ]}>
            {getAmountPrefix()}¥{Math.abs(bill.amount).toFixed(2)}
          </Text>
        </View>
        {/* 赊账类型显示结清状态 */}
        {isCredit && (
          <View style={[
            styles.settleBadge,
            bill.isSettled ? styles.settledBadge : styles.unsettledBadge,
          ]}>
            <Text style={[
              styles.settleText,
              bill.isSettled ? styles.settledText : styles.unsettledText,
            ]}>
              {bill.isSettled ? '已结清' : '未结清'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.xs,
      borderRadius: borderRadius.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    icon: {
      fontSize: 20,
    },
    billInfo: {
      flex: 1,
    },
    category: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    date: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginBottom: 2,
    },
    description: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    customerName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginTop: 2,
    },
    rightSection: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    amountBadge: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    incomeBadge: {
      backgroundColor: '#DCFCE7',
    },
    expenseBadge: {
      backgroundColor: '#FEE2E2',
    },
    creditBadge: {
      backgroundColor: '#FEF3C7',
    },
    amount: {
      fontSize: 15,
      fontWeight: '800',
      fontFamily: 'Courier',
    },
    incomeAmount: {
      color: '#16A34A',
    },
    expenseAmount: {
      color: '#DC2626',
    },
    creditAmount: {
      color: '#D97706',
    },
    settleBadge: {
      borderRadius: borderRadius.small,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    settledBadge: {
      backgroundColor: '#DCFCE7',
      borderColor: '#86EFAC',
    },
    unsettledBadge: {
      backgroundColor: '#FEF3C7',
      borderColor: '#FCD34D',
    },
    settleText: {
      fontSize: 10,
      fontWeight: '700',
    },
    settledText: {
      color: '#16A34A',
    },
    unsettledText: {
      color: '#D97706',
    },
  }),
  _colors: colors,
});

export default BillItem;