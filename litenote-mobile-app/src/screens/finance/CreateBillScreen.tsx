/**
 * 创建/编辑账单屏幕 - Neo-Brutalism 风格
 * 描边金额输入 + 糖果色类型切换 + 描边分类网格
 * 支持入账(entry)类型，选择客户；结清(settlement)类型
 */
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native';
import { Toast } from '../../components';
import { AddCategoryModal, ConfirmModal, CustomerFormModal } from '../../components/modals';
import { CustomerPicker } from '../../components/business';
import { useToast, useCategories, useStyles } from '../../hooks';
import { useAlert } from '../../providers';
import { billsService, categoriesService, customersService } from '../../services';
import { invalidateCache } from '../../lib/queryClient';
import { ttsService } from '../../services/tts';
import type { BillData, CreateBillDto, UpdateBillDto, BillType } from '../../types/bill';
import type { CategoryData } from '../../types/category';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';

// 固定分类列表
const FIXED_CATEGORIES = [
  { icon: '🌾', name: '种子' },
  { icon: '🧪', name: '化肥' },
  { icon: '🛡️', name: '农药' },
  { icon: '🚜', name: '农机' },
  { icon: '🔧', name: '农具' },
  { icon: '🚚', name: '运输' },
  { icon: '📦', name: '其他农资' },
];

interface CreateBillScreenProps {
  navigation: any;
  route?: {
    params?: {
      bill?: BillData;
      initialType?: BillType;
    };
  };
}

const CreateBillScreen: React.FC<CreateBillScreenProps> = ({ navigation, route }) => {
  const { toastState, showSuccess, showError, hideToast } = useToast();
  const { confirm } = useAlert();
  const styles = useStyles(createStyles);

  const editingBill = route?.params?.bill;
  const initialType = route?.params?.initialType;
  const isEditing = !!editingBill;

  const [amount, setAmount] = useState(editingBill?.amount?.toString() || '');
  const [type, setType] = useState<BillType>(
    editingBill?.type || initialType || 'expense'
  );
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(
    editingBill?.category || null
  );
  const [description, setDescription] = useState(editingBill?.description || '');
  const [loading, setLoading] = useState(false);

  // 入账相关
  const [customerId, setCustomerId] = useState<number | undefined>(editingBill?.customerId);
  const [customerName, setCustomerName] = useState(editingBill?.customer?.name || '');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const { categories } = useCategories(type === 'entry' ? 'expense' : type);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryData | null>(null);

  const handleTypeChange = (newType: BillType) => {
    setType(newType);
    setSelectedCategory(null);
    if (newType !== 'entry') {
      setCustomerId(undefined);
      setCustomerName('');
    }
  };

  const handleCategorySelect = (category: CategoryData) => {
    setSelectedCategory(category);
  };

  const handleCategoryLongPress = (category: CategoryData) => {
    if (category.isDefault) {
      showError('系统默认分类不能删除');
      return;
    }
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await categoriesService.deleteCategory(categoryToDelete.id);
      showSuccess('分类删除成功');
      invalidateCache.categories();
      if (selectedCategory?.id === categoryToDelete.id) {
        setSelectedCategory(null);
      }
    } catch (error: any) {
      showError(error.message || '删除分类失败');
    } finally {
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  const handleOtherClick = () => {
    setShowAddCategoryModal(true);
  };

  const handleAddCategorySuccess = () => {
    invalidateCache.categories();
  };

  const handleCustomerSelect = (selectedId: number, selectedName: string) => {
    if (selectedName === '__NEW__') {
      // 打开新建客户表单
      setShowCustomerForm(true);
      return;
    }
    setCustomerId(selectedId);
    setCustomerName(selectedName);
  };

  const handleCustomerFormSuccess = async () => {
    // 创建客户后，自动选择最新客户
    try {
      const response = await customersService.getCustomers({ limit: 1 });
      if (response.data && response.data.length > 0) {
        const latestCustomer = response.data[0];
        setCustomerId(latestCustomer.id);
        setCustomerName(latestCustomer.name);
        showSuccess(`客户"${latestCustomer.name}"创建成功`);
      }
    } catch (error) {
      // 如果获取失败，让用户手动选择
    }
  };

  const getCategoryList = () => {
    const mergedCategories: CategoryData[] = [];
    FIXED_CATEGORIES.forEach(fixedCat => {
      const matchedCategory = categories.find(cat => cat.name === fixedCat.name);
      if (matchedCategory) {
        mergedCategories.push(matchedCategory);
      }
    });
    const customCategories = categories.filter(
      cat => !FIXED_CATEGORIES.some(fixed => fixed.name === cat.name)
    );
    return [...mergedCategories, ...customCategories];
  };

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      showError('请输入有效的金额');
      return false;
    }
    if (!selectedCategory) {
      showError('请选择分类');
      return false;
    }
    if (type === 'entry' && !customerId) {
      showError('入账需要选择客户');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const billData = {
        amount: parseFloat(amount),
        type,
        description,
        date: isEditing
          ? new Date(editingBill!.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        categoryId: selectedCategory!.id,
        ...(type === 'entry' && customerId ? { customerId } : {}),
      };
      let response;
      if (isEditing) {
        response = await billsService.updateBill(editingBill!.id, billData as UpdateBillDto);
      } else {
        response = await billsService.createBill(billData as CreateBillDto);
      }
      if (response.success) {
        invalidateCache.bills();
        showSuccess(isEditing ? '账单更新成功' : '账单创建成功');

        // TTS 语音播报
        if (!isEditing) {
          ttsService.speakBillResult({
            amount: parseFloat(amount),
            type,
            description,
            customerName: type === 'entry' ? customerName : undefined,
          });
        }

        navigation.goBack();
      } else {
        showError(response.message || '操作失败');
      }
    } catch (error: any) {
      showError(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    confirm(
      '确认删除',
      '确定要删除这笔账单吗？此操作无法撤销。',
      async () => {
        try {
          setLoading(true);
          const response = await billsService.deleteBill(editingBill!.id);
          if (response.success) {
            invalidateCache.bills();
            showSuccess('账单删除成功');
            setTimeout(() => navigation.goBack(), 1000);
          } else {
            showError(response.message || '删除失败');
          }
        } catch (error: any) {
          showError(error.message || '删除失败');
        } finally {
          setLoading(false);
        }
      },
      undefined,
      { confirmText: '删除', destructive: true }
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 支出/入账/结清 切换 */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'expense' && styles.typeButtonExpenseActive]}
              onPress={() => handleTypeChange('expense')}
            >
              <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                支出
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'entry' && styles.typeButtonEntryActive]}
              onPress={() => handleTypeChange('entry')}
            >
              <Text style={[styles.typeButtonText, type === 'entry' && styles.typeButtonTextActive]}>
                入账
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'settlement' && styles.typeButtonSettlementActive]}
              onPress={() => handleTypeChange('settlement')}
            >
              <Text style={[styles.typeButtonText, type === 'settlement' && styles.typeButtonTextActive]}>
                结清
              </Text>
            </TouchableOpacity>
          </View>

          {/* 客户选择 - 仅入账类型显示 */}
          {type === 'entry' && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>👤 客户</Text>
              <TouchableOpacity
                style={styles.customerSelector}
                onPress={() => setShowCustomerPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.customerSelectorText,
                  customerName ? styles.customerSelectorTextActive : {},
                ]}>
                  {customerName || '选择客户'}
                </Text>
                <Text style={styles.customerSelectorArrow}>→</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 金额输入 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>💰 金额</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>¥</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={styles._colors.textTertiary}
              />
            </View>
          </View>

          {/* 分类选择 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>📂 分类</Text>
            <View style={styles.categoryGrid}>
              {getCategoryList().map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryItem, selectedCategory?.id === category.id && styles.categoryItemSelected]}
                  onPress={() => handleCategorySelect(category)}
                  onLongPress={() => handleCategoryLongPress(category)}
                  delayLongPress={500}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[styles.categoryName, selectedCategory?.id === category.id && styles.categoryNameSelected]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.categoryItem} onPress={handleOtherClick}>
                <Text style={styles.categoryIcon}>➕</Text>
                <Text style={styles.categoryName}>其他</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 备注输入 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>📝 备注</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="添加备注..."
              placeholderTextColor={styles._colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>{isEditing ? '更新账单' : '下一步'}</Text>
        </TouchableOpacity>
      </View>

      <Toast
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        duration={toastState.duration}
        position={toastState.position}
        onHide={hideToast}
      />

      <AddCategoryModal
        visible={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onSuccess={handleAddCategorySuccess}
        billType={type === 'entry' ? 'expense' : type}
      />

      <ConfirmModal
        visible={showDeleteConfirm}
        title="删除分类"
        message={`确定要删除分类"${categoryToDelete?.name}"吗？`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setCategoryToDelete(null); }}
      />

      <CustomerPicker
        visible={showCustomerPicker}
        onClose={() => setShowCustomerPicker(false)}
        onSelect={handleCustomerSelect}
        selectedCustomerId={customerId}
      />

      <CustomerFormModal
        visible={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        onSuccess={handleCustomerFormSuccess}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: 100 },
    typeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: 4,
      marginBottom: spacing.lg,
      alignSelf: 'center',
      width: '80%',
    },
    typeButton: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderRadius: borderRadius.small,
    },
    typeButtonExpenseActive: {
      backgroundColor: colors.expense,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    typeButtonEntryActive: {
      backgroundColor: colors.income,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    typeButtonSettlementActive: {
      backgroundColor: colors.primary,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    typeButtonText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
    typeButtonTextActive: { color: '#FFFFFF', fontWeight: '800' },
    // 客户选择器
    customerSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    customerSelectorText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    customerSelectorTextActive: {
      color: colors.textPrimary,
      fontWeight: '800',
    },
    customerSelectorArrow: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
    },
    formGroup: { marginBottom: spacing.lg },
    formLabel: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    currencySymbol: {
      fontSize: 28,
      fontWeight: '800',
      fontFamily: 'Courier',
      color: colors.textPrimary,
      marginRight: spacing.sm,
    },
    amountInput: {
      flex: 1,
      fontSize: 28,
      fontWeight: '800',
      fontFamily: 'Courier',
      color: colors.textPrimary,
      padding: 0,
    },
    descriptionInput: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.input,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      minHeight: 80,
    },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    categoryItem: {
      width: '22%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.surface,
      padding: spacing.sm,
    },
    categoryItemSelected: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
    },
    categoryIcon: { fontSize: 24, marginBottom: 4 },
    categoryName: { fontSize: 12, color: colors.textPrimary, textAlign: 'center', fontWeight: '600' },
    categoryNameSelected: { color: colors.textPrimary, fontWeight: '800' },
    bottomActions: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      backgroundColor: colors.background,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
    },
    cancelButton: {
      flex: 1,
      height: 52,
      borderRadius: borderRadius.button,
      backgroundColor: colors.surface,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    saveButton: {
      flex: 1,
      height: 52,
      borderRadius: borderRadius.button,
      backgroundColor: colors.primary,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.small,
    },
    saveButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  }),
  _colors: colors,
});

export default CreateBillScreen;
