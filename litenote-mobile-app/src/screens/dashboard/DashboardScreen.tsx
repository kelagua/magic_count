/**
 * Dashboard 首页 - Neo-Brutalism 风格
 * 粗线框、饱和糖果色块、粗描边、平移阴影
 * 像彩色积木构成的界面
 */
import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { BrutalPressable } from '../../components/ui';
import { DashboardSkeleton } from '../../components/skeleton';
import { useDashboard, useStyles } from '../../hooks';
import type { BillData } from '../../types/bill';

/**
 * 列表项入场动画 - 交错滑入 + 淡入
 * 每个 item 延迟 index * 80ms，从下方 24px 滑入
 */
function AnimatedListItem({ children, index }: { children: React.ReactNode; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [24, 0],
          }),
        }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const styles = useStyles(createStyles);
  const {
    recentBills,
    monthIncome,
    monthExpense,
    monthBalance,
    isLoading,
    isFetching,
    refetch,
  } = useDashboard();

  const currentDate = new Date();
  const monthName = `${currentDate.getMonth() + 1}月账本`;
  const yearName = `${currentDate.getFullYear()}`;

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleAddBill = () => {
    navigation.navigate('CreateBill' as never);
  };

  const handleViewAllBills = () => {
    navigation.navigate('AllBills');
  };

  const handleViewExpense = () => {
    navigation.navigate('AllBills', { initialFilter: 'expense' });
  };

  const handleViewIncome = () => {
    navigation.navigate('AllBills', { initialFilter: 'income' });
  };

  const handleViewBillDetail = (bill: BillData) => {
    navigation.navigate('CreateBill', { bill });
  };

  // 分类图标
  const getCategoryIcon = (categoryName?: string): string => {
    const iconMap: { [key: string]: string } = {
      '种子': '🌾',
      '化肥': '🧪',
      '农药': '🛡️',
      '农机': '🚜',
      '农具': '🔧',
      '运输': '🚚',
      '客户回款': '💰',
      '现金收款': '💵',
    };
    return iconMap[categoryName || ''] || '📝';
  };

  // Neo-Brutalism 分类色块 - 饱和糖果色
  const getCategoryBlockColor = (categoryName?: string): string => {
    const colorMap: { [key: string]: string } = {
      '种子': '#FACC15',
      '化肥': '#3B82F6',
      '农药': '#EC4899',
      '农机': '#A855F7',
      '农具': '#EF4444',
      '运输': '#F97316',
      '客户回款': '#22C55E',
      '现金收款': '#16A34A',
    };
    return colorMap[categoryName || ''] || '#E5E5E5';
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ========== Header ========== */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{monthName}</Text>
            <Text style={styles.headerSticker}>✦</Text>
          </View>
          <Text style={styles.headerSubtitle}>{yearName}</Text>
        </View>
      </View>

      {/* ========== Overview Card - 主色块 ========== */}
      <TouchableOpacity style={styles.overviewCard} activeOpacity={0.95}>
        {/* 装饰贴纸 */}
        <View style={styles.stickerTopRight}>
          <Text style={styles.stickerText}>⚡</Text>
        </View>
        <View style={styles.overviewContent}>
          <Text style={styles.overviewLabel}>本月往来差额</Text>
          <Text style={styles.overviewBalance}>¥ {monthBalance.toFixed(2)}</Text>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewStats}>
            <TouchableOpacity style={styles.statBlock} onPress={handleViewExpense}>
              <View style={styles.statIconBlock}>
                <Text style={styles.statIcon}>↘</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>本月赊账</Text>
                <Text style={styles.statValue}>¥ {monthExpense.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBlockGreen} onPress={handleViewIncome}>
              <View style={styles.statIconBlockGreen}>
                <Text style={styles.statIcon}>↗</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>本月回款</Text>
                <Text style={styles.statValue}>¥ {monthIncome.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* ========== Recent Transactions ========== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionSticker}>📋</Text>
            <Text style={styles.sectionTitle}>近期账目</Text>
          </View>
          <BrutalPressable
            onPress={handleViewAllBills}
            style={styles.viewAllButton}
            shadowOffset={2}
            shadowColor={styles._colors.stroke}
          >
            <Text style={styles.viewAllText}>查看全部 →</Text>
          </BrutalPressable>
        </View>

        {recentBills.length > 0 ? (
          <View style={styles.transactionList}>
            {recentBills.map((bill, index) => (
              <AnimatedListItem key={bill.id} index={index}>
                <BrutalPressable
                  style={styles.transactionItem}
                  shadowOffset={3}
                  shadowColor={styles._colors.stroke}
                  onPress={() => handleViewBillDetail(bill)}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: getCategoryBlockColor(bill.category?.name) },
                    ]}>
                      <Text style={styles.transactionIconText}>
                        {bill.category?.icon || getCategoryIcon(bill.category?.name)}
                      </Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {bill.description || bill.category?.name || '未分类'}
                      </Text>
                      <Text style={styles.transactionMeta}>
                        {new Date(bill.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} · {bill.category?.name || '未分类'}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.amountBadge,
                    bill.type === 'income' ? styles.incomeBadge : styles.expenseBadge,
                  ]}>
                    <Text style={[
                      styles.transactionAmount,
                      bill.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                    ]}>
                      {bill.type === 'income' ? '+' : '-'}¥{Number(bill.amount).toFixed(2)}
                    </Text>
                  </View>
                </BrutalPressable>
              </AnimatedListItem>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>暂无账目记录</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddBill}>
              <Text style={styles.emptyButtonText}>记录第一笔</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Neo-Brutalism 样式
const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: 80,
    },

    // ===== Header =====
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xxl,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSticker: {
      fontSize: 20,
      color: colors.accent,
    },
    headerSubtitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textTertiary,
      marginTop: spacing.xs,
      fontFamily: 'Courier',
    },

    // ===== Overview Card =====
    overviewCard: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thick,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginBottom: spacing.xxl,
      ...shadow.large,
    },
    stickerTopRight: {
      position: 'absolute',
      right: 12,
      top: 12,
      width: 40,
      height: 40,
      borderRadius: borderRadius.small,
      backgroundColor: colors.accent,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '12deg' }],
      zIndex: 10,
    },
    stickerText: {
      fontSize: 20,
    },
    overviewContent: {
      padding: spacing.xl,
    },
    overviewLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.85)',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    overviewBalance: {
      fontSize: 40,
      fontWeight: '900',
      color: '#FFFFFF',
      marginTop: spacing.sm,
      letterSpacing: -1.5,
    },
    overviewDivider: {
      height: borderWidth.thin,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      marginVertical: spacing.lg,
    },
    overviewStats: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    statBlock: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: borderRadius.medium,
      padding: spacing.md,
      borderWidth: borderWidth.thin,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statBlockGreen: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: borderRadius.medium,
      padding: spacing.md,
      borderWidth: borderWidth.thin,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statIconBlock: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.small,
      backgroundColor: colors.error,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIconBlockGreen: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.small,
      backgroundColor: colors.success,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIcon: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '800',
    },
    statLabel: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '600',
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },

    // ===== Progress Cards Stack =====
    carouselWrapper: {
      marginBottom: spacing.md,
      position: 'relative',
    },
    progressCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      ...shadow.medium,
    },
    progressCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    progressCardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    progressCardType: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginTop: 1,
    },

    // Budget card styles (reused for progress cards)
    budgetTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    budgetPercentBadge: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    budgetPercentText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'Courier',
    },
    progressBarContainer: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    budgetProgressBar: {
    },
    budgetLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    budgetLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      fontFamily: 'Courier',
    },

    // Progress empty state
    progressEmptyCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      borderStyle: 'dashed',
      padding: spacing.xl,
      marginBottom: spacing.xxl,
      alignItems: 'center',
    },
    progressEmptyIcon: {
      fontSize: 32,
      marginBottom: spacing.sm,
    },
    progressEmptyText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textTertiary,
      textAlign: 'center',
    },
    progressEmptyHint: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginTop: spacing.sm,
    },

    // ===== Section =====
    section: {
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sectionSticker: {
      fontSize: 18,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    viewAllButton: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    // ===== Transaction List =====
    transactionList: {
      gap: spacing.md,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    transactionIconText: {
      fontSize: 22,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    transactionMeta: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      fontFamily: 'Courier',
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
    transactionAmount: {
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

    // ===== Empty State =====
    emptyState: {
      alignItems: 'center',
      padding: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.medium,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textTertiary,
      marginBottom: spacing.lg,
    },
    emptyButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.small,
    },
    emptyButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },

  }),
  _colors: colors,
});
