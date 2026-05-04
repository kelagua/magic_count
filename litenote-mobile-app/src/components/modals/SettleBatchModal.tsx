/**
 * 批量结算模态框 - Neo-Brutalism 风格
 * 显示选中的赊账账单，确认批量结算
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import { useToast, useStyles } from '../../hooks';
import { billsService } from '../../services';
import { ttsService } from '../../services/tts';
import { invalidateCache } from '../../lib/queryClient';
import type { BillData } from '../../types/bill';
import Modal from '../ui/Modal';

interface SettleBatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedBills: BillData[];
}

const PAYMENT_METHODS = [
  { label: '现金', value: 'cash' },
  { label: '转账', value: 'transfer' },
  { label: '其他', value: 'other' },
];

export const SettleBatchModal: React.FC<SettleBatchModalProps> = ({
  visible,
  onClose,
  onSuccess,
  selectedBills,
}) => {
  const styles = useStyles(createStyles);
  const { showError, showSuccess } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false); // 二次确认状态

  const totalAmount = selectedBills.reduce((sum, bill) => sum + Number(bill.amount), 0);

  const handleSettle = async () => {
    if (selectedBills.length === 0) {
      showError('请选择要结算的账单');
      return;
    }

    // 二次确认：首次点击进入确认步骤，再次点击执行结算
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    setLoading(true);
    try {
      const response = await billsService.settleBatch({
        billIds: selectedBills.map(bill => bill.id),
        paymentMethod,
      });

      if (response.success) {
        invalidateCache.bills();
        showSuccess(`成功结清${selectedBills.length}笔赊账`);

        // TTS 语音播报结算结果
        ttsService.speakSettleResult(totalAmount, selectedBills.length);

        onSuccess();
        handleClose();
      } else {
        showError(response.message || '结算失败');
      }
    } catch (error: any) {
      showError(error.message || '结算失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmStep(false);
    setPaymentMethod('cash');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="批量结算"
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 选中账单汇总 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>待结算账单</Text>
          <Text style={styles.summaryCount}>{selectedBills.length} 笔</Text>
          <View style={styles.summaryDivider} />
          <Text style={styles.summaryLabel}>合计金额</Text>
          <Text style={styles.summaryAmount}>¥ {totalAmount.toFixed(2)}</Text>
        </View>

        {/* 账单列表 */}
        <View style={styles.billList}>
          {selectedBills.map((bill) => (
            <View key={bill.id} style={styles.billItem}>
              <View style={styles.billInfo}>
                <Text style={styles.billDescription}>
                  {bill.description || bill.category?.name || '赊账'}
                </Text>
                <Text style={styles.billDate}>
                  {new Date(bill.date).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {bill.customer?.name ? ` · ${bill.customer.name}` : ''}
                </Text>
              </View>
              <Text style={styles.billAmount}>¥ {Number(bill.amount).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* 支付方式选择 */}
        <View style={styles.section}>
          <Text style={styles.label}>结算方式</Text>
          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.methodButton,
                  paymentMethod === method.value && styles.methodButtonActive,
                ]}
                onPress={() => setPaymentMethod(method.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.methodText,
                    paymentMethod === method.value && styles.methodTextActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleClose}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.settleButton, confirmStep && styles.settleButtonConfirm]}
          onPress={handleSettle}
          disabled={loading}
        >
          <Text style={styles.settleButtonText}>
            {loading ? '结算中...' : confirmStep ? '⚠️ 再次点击确认结算' : '确认结算'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    content: {
      maxHeight: 400,
    },
    contentContainer: {
      paddingVertical: spacing.sm,
    },
    summaryCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    summaryCount: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
    summaryDivider: {
      height: borderWidth.thin,
      backgroundColor: colors.stroke,
      width: '80%',
      marginVertical: spacing.md,
    },
    summaryAmount: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.primary,
      fontFamily: 'Courier',
      marginTop: spacing.xs,
    },
    billList: {
      marginBottom: spacing.lg,
    },
    billItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
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
    billAmount: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.expense,
      fontFamily: 'Courier',
    },
    section: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    paymentMethods: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    methodButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    methodButtonActive: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.medium,
    },
    methodText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    methodTextActive: {
      color: colors.textPrimary,
      fontWeight: '800',
    },
    footer: {
      flexDirection: 'row',
      paddingTop: spacing.md,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
      gap: spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      alignItems: 'center',
      ...shadow.small,
    },
    cancelButton: {
      backgroundColor: colors.surface,
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    settleButton: {
      backgroundColor: colors.success,
    },
    settleButtonConfirm: {
      backgroundColor: colors.expense,
    },
    settleButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  }),
  _colors: colors,
});
