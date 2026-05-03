/**
 * 客户表单模态框 - Neo-Brutalism 风格
 * 创建/编辑客户信息
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import { useToast, useStyles } from '../../hooks';
import { customersService } from '../../services';
import type { CustomerData, CreateCustomerDto, UpdateCustomerDto } from '../../types/customer';
import Modal from '../ui/Modal';

interface CustomerFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: CustomerData | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  visible,
  onClose,
  onSuccess,
  customer,
}) => {
  const styles = useStyles(createStyles);
  const { showError, showSuccess } = useToast();
  const isEditing = !!customer;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
  }, [customer, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError('请输入客户名称');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && customer) {
        const data: UpdateCustomerDto = {};
        if (name.trim() !== customer.name) data.name = name.trim();
        if (phone.trim() !== (customer.phone || '')) data.phone = phone.trim() || undefined;
        if (address.trim() !== (customer.address || '')) data.address = address.trim() || undefined;
        if (notes.trim() !== (customer.notes || '')) data.notes = notes.trim() || undefined;

        await customersService.updateCustomer(customer.id, data);
        showSuccess('客户更新成功');
      } else {
        const data: CreateCustomerDto = {
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        };

        await customersService.createCustomer(data);
        showSuccess('客户创建成功');
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      showError(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isEditing) {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={isEditing ? '编辑客户' : '新增客户'}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 客户名称 */}
        <View style={styles.section}>
          <Text style={styles.label}>客户名称 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="输入客户名称"
            placeholderTextColor={styles._colors.textTertiary}
            maxLength={50}
          />
        </View>

        {/* 联系电话 */}
        <View style={styles.section}>
          <Text style={styles.label}>联系电话</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="输入联系电话"
            placeholderTextColor={styles._colors.textTertiary}
            keyboardType="phone-pad"
            maxLength={20}
          />
        </View>

        {/* 地址 */}
        <View style={styles.section}>
          <Text style={styles.label}>地址</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="输入地址"
            placeholderTextColor={styles._colors.textTertiary}
            maxLength={200}
          />
        </View>

        {/* 备注 */}
        <View style={styles.section}>
          <Text style={styles.label}>备注</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="添加备注..."
            placeholderTextColor={styles._colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
          />
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
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '保存中...' : isEditing ? '更新' : '创建'}
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
    section: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      padding: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    textArea: {
      minHeight: 80,
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
    saveButton: {
      backgroundColor: colors.primary,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  }),
  _colors: colors,
});
