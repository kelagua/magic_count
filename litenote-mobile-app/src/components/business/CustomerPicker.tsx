/**
 * 客户选择器组件 - Neo-Brutalism 风格
 * 搜索客户列表，用于创建赊账账单时选择客户
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import { useStyles } from '../../hooks';
import { customersService } from '../../services';
import type { CustomerData } from '../../types/customer';
import Modal from '../ui/Modal';

interface CustomerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (customerId: number, customerName: string) => void;
  selectedCustomerId?: number;
}

export const CustomerPicker: React.FC<CustomerPickerProps> = ({
  visible,
  onClose,
  onSelect,
  selectedCustomerId,
}) => {
  const styles = useStyles(createStyles);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await customersService.getCustomers({
        search: search.trim() || undefined,
        limit: 50,
      });
      setCustomers(response.data || []);
    } catch (error) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (visible) {
      fetchCustomers();
    }
  }, [visible, search, fetchCustomers]);

  const handleSelect = (customer: CustomerData) => {
    onSelect(customer.id, customer.name);
    onClose();
  };

  const handleAddNew = () => {
    // Navigate to create customer - this will be handled by parent
    onSelect(-1, '__NEW__');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="选择客户"
    >
      <View style={styles.content}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="搜索客户..."
            placeholderTextColor={styles._colors.textTertiary}
          />
        </View>

        {/* 客户列表 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={styles._colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {customers.length > 0 ? (
              customers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.customerItem,
                    selectedCustomerId === customer.id && styles.customerItemSelected,
                  ]}
                  onPress={() => handleSelect(customer)}
                  activeOpacity={0.7}
                >
                  <View style={styles.customerIcon}>
                    <Text style={styles.customerIconText}>
                      {customer.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    {customer.phone && (
                      <Text style={styles.customerPhone}>{customer.phone}</Text>
                    )}
                  </View>
                  {selectedCustomerId === customer.id && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkIcon}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👤</Text>
                <Text style={styles.emptyText}>
                  {search ? '未找到匹配的客户' : '暂无客户'}
                </Text>
              </View>
            )}

            {/* 添加新客户 */}
            <TouchableOpacity
              style={styles.addNewButton}
              onPress={handleAddNew}
              activeOpacity={0.7}
            >
              <Text style={styles.addNewIcon}>+</Text>
              <Text style={styles.addNewText}>新增客户</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    content: {
      maxHeight: 400,
    },
    searchContainer: {
      marginBottom: spacing.md,
    },
    searchInput: {
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      padding: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
    },
    list: {
      maxHeight: 320,
    },
    listContent: {
      paddingBottom: spacing.md,
    },
    customerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
    },
    customerItemSelected: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.medium,
      ...shadow.small,
    },
    customerIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.small,
      backgroundColor: colors.primaryLight,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    customerIconText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    customerPhone: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    checkBadge: {
      width: 28,
      height: 28,
      borderRadius: borderRadius.small,
      backgroundColor: colors.success,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkIcon: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyIcon: {
      fontSize: 36,
      marginBottom: spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    addNewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      borderStyle: 'dashed',
      backgroundColor: colors.background,
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    addNewIcon: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
    },
    addNewText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
  }),
  _colors: colors,
});
