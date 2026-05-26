/**
 * 客户详情页面 - Neo-Brutalism 风格
 * 显示客户信息、未结清入账、账单列表
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import { useToast, useStyles } from '../../hooks';
import { customersService, billsService } from '../../services';
import { CustomerFormModal, SettleBatchModal } from '../../components/modals';
import type { CustomerData } from '../../types/customer';
import type { BillData } from '../../types/bill';

export default function CustomerDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const styles = useStyles(createStyles);
  const { showSuccess, showError } = useToast();

  const customerId = (route.params as any)?.customerId;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bills, setBills] = useState<BillData[]>([]);
  const [unsettledBills, setUnsettledBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedForSettle, setSelectedForSettle] = useState<BillData[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [customerRes, billsRes] = await Promise.all([
        customersService.getCustomer(customerId),
        customersService.getCustomerBills(customerId, { limit: 100 }),
      ]);

      setCustomer(customerRes.data || null);
      const allBills = billsRes.data || [];
      setBills(allBills);
      setUnsettledBills(allBills.filter(b => b.type === 'entry' && !b.isSettled));
    } catch (error: any) {
      showError(error.message || '获取客户信息失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  const handleEditSuccess = () => {
    fetchData();
  };

  const handleSelectAllUnsettled = () => {
    setSelectedForSettle(unsettledBills);
    setShowSettleModal(true);
  };

  const handleSettleSuccess = () => {
    fetchData();
  };

  const unsettledTotal = unsettledBills.reduce((sum, b) => sum + Number(b.amount), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={styles._colors.primary} />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>客户不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 客户信息卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.avatarBlock}>
              <Text style={styles.avatarText}>{customer.name.charAt(0)}</Text>
            </View>
            <View style={styles.nameSection}>
              <Text style={styles.customerName}>{customer.name}</Text>
              {customer.phone && (
                <Text style={styles.customerPhone}>{customer.phone}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.editButtonText}>编辑</Text>
            </TouchableOpacity>
          </View>

          {/* 详细信息 */}
          {(customer.address || customer.notes) && (
            <View style={styles.infoDetails}>
              {customer.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>地址</Text>
                  <Text style={styles.infoValue}>{customer.address}</Text>
                </View>
              )}
              {customer.notes && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>备注</Text>
                  <Text style={styles.infoValue}>{customer.notes}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 未结清概览 */}
        <View style={styles.creditCard}>
          <View style={styles.creditHeader}>
            <View style={styles.creditTitleRow}>
              <Text style={styles.sectionSticker}>💳</Text>
              <Text style={styles.creditTitle}>未结清概览</Text>
            </View>
            {unsettledBills.length > 0 && (
              <TouchableOpacity
                style={styles.settleButton}
                onPress={handleSelectAllUnsettled}
                activeOpacity={0.8}
              >
                <Text style={styles.settleButtonText}>一键结清</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.creditStats}>
            <View style={styles.creditStatBlock}>
              <Text style={styles.creditStatLabel}>未结清金额</Text>
              <Text style={styles.creditStatAmount}>¥ {unsettledTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.creditStatDivider} />
            <View style={styles.creditStatBlock}>
              <Text style={styles.creditStatLabel}>未结清笔数</Text>
              <Text style={styles.creditStatCount}>{unsettledBills.length} 笔</Text>
            </View>
          </View>
        </View>

        {/* 未结清账单 */}
        {unsettledBills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>未结清入账</Text>
            </View>
            {unsettledBills.map((bill) => (
              <View key={bill.id} style={styles.billItem}>
                <View style={styles.billLeft}>
                  <View style={[styles.billIconBlock, { backgroundColor: styles._colors.warning }]}>
                    <Text style={styles.billIconText}>⏳</Text>
                  </View>
                  <View style={styles.billInfo}>
                    <Text style={styles.billDescription}>
                      {bill.description || bill.category?.name || '入账'}
                    </Text>
                    <Text style={styles.billDate}>
                      {new Date(bill.date).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.unsettledBadge}>
                  <Text style={styles.unsettledAmount}>¥ {Number(bill.amount).toFixed(2)}</Text>
                  <Text style={styles.unsettledLabel}>未结清</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 全部账单 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>全部账单</Text>
            <Text style={styles.sectionCount}>{bills.length} 笔</Text>
          </View>
          {bills.length > 0 ? (
            bills.map((bill) => (
              <View key={bill.id} style={styles.billItem}>
                <View style={styles.billLeft}>
                  <View style={[
                    styles.billIconBlock,
                    { backgroundColor: bill.type === 'entry' ? styles._colors.success : bill.type === 'settlement' ? styles._colors.primary : styles._colors.accent },
                  ]}>
                    <Text style={styles.billIconText}>
                      {bill.type === 'entry' ? '↗' : bill.type === 'settlement' ? '✓' : '↘'}
                    </Text>
                  </View>
                  <View style={styles.billInfo}>
                    <Text style={styles.billDescription}>
                      {bill.description || bill.category?.name || '未分类'}
                    </Text>
                    <Text style={styles.billDate}>
                      {new Date(bill.date).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {bill.isSettled ? ' · 已结清' : bill.type === 'entry' ? ' · 未结清' : ''}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.amountBadge,
                  bill.type === 'entry' || bill.type === 'settlement' ? styles.incomeBadge : styles.expenseBadge,
                ]}>
                  <Text style={[
                    styles.billAmount,
                    bill.type === 'entry' || bill.type === 'settlement' ? styles.incomeAmount : styles.expenseAmount,
                  ]}>
                    {bill.type === 'expense' ? '-' : '+'}¥{Number(bill.amount).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyBills}>
              <Text style={styles.emptyBillsText}>暂无账单记录</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 模态框 */}
      <CustomerFormModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        customer={customer}
      />

      <SettleBatchModal
        visible={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        onSuccess={handleSettleSuccess}
        selectedBills={selectedForSettle}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    errorText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textTertiary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxxl,
    },
    // 客户信息卡片
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...shadow.medium,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarBlock: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.accent,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    nameSection: {
      flex: 1,
    },
    customerName: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    customerPhone: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    editButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.small,
      backgroundColor: colors.primaryLight,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    editButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    infoDetails: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.divider,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    infoLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textTertiary,
      width: 50,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      flex: 1,
    },
    // 未结清概览
    creditCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...shadow.medium,
    },
    creditHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    creditTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sectionSticker: {
      fontSize: 18,
    },
    creditTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    settleButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.small,
      backgroundColor: colors.success,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    settleButtonText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    creditStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    creditStatBlock: {
      flex: 1,
      alignItems: 'center',
    },
    creditStatLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      marginBottom: spacing.xs,
    },
    creditStatAmount: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.expense,
      fontFamily: 'Courier',
    },
    creditStatCount: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.warning,
      fontFamily: 'Courier',
    },
    creditStatDivider: {
      width: borderWidth.thin,
      height: 40,
      backgroundColor: colors.divider,
      marginHorizontal: spacing.md,
    },
    // 区块
    section: {
      marginBottom: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    sectionCount: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
      fontFamily: 'Courier',
    },
    // 账单项
    billItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      marginBottom: spacing.sm,
    },
    billLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    billIconBlock: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    billIconText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    billInfo: {
      flex: 1,
    },
    billDescription: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    billDate: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    unsettledBadge: {
      alignItems: 'flex-end',
    },
    unsettledAmount: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.warning,
      fontFamily: 'Courier',
    },
    unsettledLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.warning,
      marginTop: 2,
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
    billAmount: {
      fontSize: 14,
      fontWeight: '800',
      fontFamily: 'Courier',
    },
    incomeAmount: {
      color: '#16A34A',
    },
    expenseAmount: {
      color: '#DC2626',
    },
    emptyBills: {
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    emptyBillsText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textTertiary,
    },
  }),
  _colors: colors,
});
