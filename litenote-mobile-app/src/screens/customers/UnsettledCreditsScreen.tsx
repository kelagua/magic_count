/**
 * 未结清入账页面 - Neo-Brutalism 风格
 * 显示所有未结清的入账账单，支持多选批量结算
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
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import { useToast, useStyles } from '../../hooks';
import { billsService } from '../../services';
import { SettleBatchModal } from '../../components/modals';
import type { BillData } from '../../types/bill';

export default function UnsettledCreditsScreen() {
  const styles = useStyles(createStyles);
  const { showError } = useToast();

  const [unsettledBills, setUnsettledBills] = useState<BillData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showSettleModal, setShowSettleModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await billsService.getBills({
        type: 'entry',
        isSettled: false,
        limit: 200,
        orderBy: 'date',
        orderDirection: 'desc',
      });
      setUnsettledBills(response.data || []);
    } catch (error: any) {
      showError(error.message || '获取入账列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSelectedIds(new Set());
    await fetchData();
  }, [fetchData]);

  const toggleSelect = (billId: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(billId)) {
        newSet.delete(billId);
      } else {
        newSet.add(billId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === unsettledBills.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unsettledBills.map(b => b.id)));
    }
  };

  const handleSettle = () => {
    const selectedBills = unsettledBills.filter(b => selectedIds.has(b.id));
    setShowSettleModal(true);
  };

  const handleSettleSuccess = () => {
    setSelectedIds(new Set());
    fetchData();
  };

  const selectedTotal = unsettledBills
    .filter(b => selectedIds.has(b.id))
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const totalAmount = unsettledBills.reduce((sum, b) => sum + Number(b.amount), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={styles._colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 汇总卡片 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>总未结清</Text>
            <Text style={styles.summaryAmount}>¥ {totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>入账笔数</Text>
            <Text style={styles.summaryCount}>{unsettledBills.length} 笔</Text>
          </View>
        </View>
      </View>

      {/* 全选按钮 */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.selectAllButton} onPress={selectAll} activeOpacity={0.7}>
          <View style={[
            styles.checkbox,
            selectedIds.size === unsettledBills.length && unsettledBills.length > 0 && styles.checkboxChecked,
          ]}>
            {selectedIds.size === unsettledBills.length && unsettledBills.length > 0 && (
              <Text style={styles.checkMark}>✓</Text>
            )}
          </View>
          <Text style={styles.selectAllText}>全选</Text>
        </TouchableOpacity>
        <Text style={styles.selectedInfo}>
          已选 {selectedIds.size} 笔，合计 ¥{selectedTotal.toFixed(2)}
        </Text>
      </View>

      {/* 账单列表 */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {unsettledBills.length > 0 ? (
          unsettledBills.map((bill) => {
            const isSelected = selectedIds.has(bill.id);
            return (
              <TouchableOpacity
                key={bill.id}
                style={[
                  styles.billItem,
                  isSelected && styles.billItemSelected,
                ]}
                onPress={() => toggleSelect(bill.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxChecked,
                ]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>

                <View style={styles.billIconBlock}>
                  <Text style={styles.billIconText}>⏳</Text>
                </View>

                <View style={styles.billInfo}>
                  <Text style={styles.billDescription}>
                    {bill.description || bill.category?.name || '入账'}
                  </Text>
                  <Text style={styles.billMeta}>
                    {new Date(bill.date).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {bill.customer?.name ? ` · ${bill.customer.name}` : ''}
                  </Text>
                </View>

                <Text style={styles.billAmount}>¥ {Number(bill.amount).toFixed(2)}</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>所有入账已结清</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部结算按钮 */}
      {selectedIds.size > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomLabel}>已选金额</Text>
            <Text style={styles.bottomAmount}>¥ {selectedTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.settleButton}
            onPress={handleSettle}
            activeOpacity={0.8}
          >
            <Text style={styles.settleButtonText}>
              结算 ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 结算模态框 */}
      <SettleBatchModal
        visible={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        onSuccess={handleSettleSuccess}
        selectedBills={unsettledBills.filter(b => selectedIds.has(b.id))}
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
    // 汇总卡片
    summaryCard: {
      backgroundColor: colors.warning,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thick,
      borderColor: colors.stroke,
      margin: spacing.lg,
      padding: spacing.xl,
      ...shadow.medium,
    },
    summaryContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryBlock: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: 'rgba(0, 0, 0, 0.6)',
    },
    summaryAmount: {
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      fontFamily: 'Courier',
      marginTop: spacing.xs,
    },
    summaryDivider: {
      width: borderWidth.thin,
      height: 40,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    summaryCount: {
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      fontFamily: 'Courier',
      marginTop: spacing.xs,
    },
    // 工具栏
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    selectAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginRight: spacing.md,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderWidth: borderWidth.medium,
    },
    checkMark: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    selectAllText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    selectedInfo: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    // 列表
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100,
    },
    billItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    billItemSelected: {
      backgroundColor: colors.primaryLight,
      borderWidth: borderWidth.medium,
      ...shadow.small,
    },
    billIconBlock: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.small,
      backgroundColor: colors.accent,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: spacing.sm,
    },
    billIconText: {
      fontSize: 16,
    },
    billInfo: {
      flex: 1,
    },
    billDescription: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    billMeta: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    billAmount: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.expense,
      fontFamily: 'Courier',
      marginLeft: spacing.sm,
    },
    // 空状态
    emptyState: {
      alignItems: 'center',
      padding: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textTertiary,
    },
    // 底部结算栏
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      paddingBottom: spacing.xxl,
      backgroundColor: colors.surface,
      borderTopWidth: borderWidth.thick,
      borderTopColor: colors.stroke,
    },
    bottomInfo: {},
    bottomLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    bottomAmount: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.expense,
      fontFamily: 'Courier',
    },
    settleButton: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      backgroundColor: colors.success,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.small,
    },
    settleButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  }),
  _colors: colors,
});
