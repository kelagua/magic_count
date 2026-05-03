/**
 * 客户列表页面 - Neo-Brutalism 风格
 * 显示客户列表，支持搜索、新增、编辑、删除
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import { useToast, useStyles } from '../../hooks';
import { useAlert } from '../../providers';
import { customersService } from '../../services';
import { CustomerFormModal, ConfirmModal } from '../../components/modals';
import type { CustomerData } from '../../types/customer';

export default function CustomersScreen() {
  const navigation = useNavigation();
  const styles = useStyles(createStyles);
  const { showSuccess, showError } = useToast();
  const { confirm } = useAlert();

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customersService.getCustomers({
        search: search.trim() || undefined,
        limit: 100,
      });
      setCustomers(response.data || []);
    } catch (error: any) {
      showError(error.message || '获取客户列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, showError]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerPress = (customer: CustomerData) => {
    (navigation as any).navigate('CustomerDetail', { customerId: customer.id });
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowFormModal(true);
  };

  const handleEditCustomer = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setShowFormModal(true);
  };

  const handleDeleteCustomer = (customer: CustomerData) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await customersService.deleteCustomer(customerToDelete.id);
      showSuccess('客户删除成功');
      fetchCustomers();
    } catch (error: any) {
      showError(error.message || '删除客户失败');
    } finally {
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    fetchCustomers();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={styles._colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>客户管理</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer} activeOpacity={0.8}>
          <Text style={styles.addButtonIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="搜索客户名称/电话..."
          placeholderTextColor={styles._colors.textTertiary}
        />
      </View>

      {/* 客户列表 */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {customers.length > 0 ? (
          customers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              style={styles.customerCard}
              onPress={() => handleCustomerPress(customer)}
              activeOpacity={0.8}
            >
              <View style={styles.customerLeft}>
                <View style={styles.avatarBlock}>
                  <Text style={styles.avatarText}>
                    {customer.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  {customer.phone && (
                    <Text style={styles.customerPhone}>{customer.phone}</Text>
                  )}
                  {customer.address && (
                    <Text style={styles.customerAddress} numberOfLines={1}>
                      {customer.address}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.customerActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditCustomer(customer)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.editIcon}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteCustomer(customer)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>
              {search ? '未找到匹配的客户' : '暂无客户'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddCustomer}>
                <Text style={styles.emptyButtonText}>添加第一个客户</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* 模态框 */}
      <CustomerFormModal
        visible={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingCustomer(null);
        }}
        onSuccess={handleFormSuccess}
        customer={editingCustomer}
      />

      <ConfirmModal
        visible={showDeleteConfirm}
        title="删除客户"
        message={`确定要删除客户"${customerToDelete?.name}"吗？删除后无法恢复。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCustomerToDelete(null);
        }}
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.primary,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.small,
    },
    addButtonIcon: {
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: -2,
    },
    searchContainer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    searchInput: {
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      padding: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    customerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadow.small,
    },
    customerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarBlock: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.accent,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    customerPhone: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      fontFamily: 'Courier',
    },
    customerAddress: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      marginTop: 2,
    },
    customerActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.small,
      backgroundColor: colors.background,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButton: {
      backgroundColor: '#FEE2E2',
    },
    editIcon: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
    },
    deleteIcon: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.error,
    },
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
