import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Tag, Space, Form, Input, Select, DatePicker,
  Modal, InputNumber, message, Popconfirm, Row, Col, Checkbox,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  CheckCircleOutlined, CheckSquareOutlined,
} from '@ant-design/icons';
import { billsApi } from '../api/bills';
import { categoriesApi } from '../api/categories';
import { customersApi } from '../api/customers';
import type { Bill, Category, Customer, BillQuery, CreateBillRequest, UpdateBillRequest, Pagination } from '../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 筛选
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>();
  const [filterCustomerId, setFilterCustomerId] = useState<number | undefined>();
  const [filterIsSettled, setFilterIsSettled] = useState<boolean | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // 弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();

  // 批量结算弹窗
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState('现金');
  const [settleLoading, setSettleLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCustomers();
    fetchBills();
  }, []);

  const fetchBills = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: BillQuery = {
        page,
        limit: pagination.limit,
        type: filterType as BillQuery['type'],
        categoryId: filterCategoryId,
        customerId: filterCustomerId,
        isSettled: filterIsSettled,
        startDate: filterDateRange?.[0]?.format('YYYY-MM-DD') || undefined,
        endDate: filterDateRange?.[1]?.format('YYYY-MM-DD') || undefined,
      };
      const res = await billsApi.getBills(params);
      if (res.success) {
        setBills(res.data ?? []);
        setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (error) {
      message.error('获取账单列表失败');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategoryId, filterCustomerId, filterIsSettled, filterDateRange, pagination.limit]);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch { /* ignore */ }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customersApi.getCustomers();
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch { /* ignore */ }
  };

  const handleSearch = () => {
    setSelectedRowKeys([]);
    fetchBills(1);
  };

  const handleReset = () => {
    setFilterType(undefined);
    setFilterCategoryId(undefined);
    setFilterCustomerId(undefined);
    setFilterIsSettled(undefined);
    setFilterDateRange(null);
    setSelectedRowKeys([]);
    setTimeout(() => fetchBills(1), 0);
  };

  // 新建/编辑
  const openCreateModal = () => {
    setEditBill(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs().format('YYYY-MM-DD') });
    setModalOpen(true);
  };

  const openEditModal = (bill: Bill) => {
    setEditBill(bill);
    form.setFieldsValue({
      amount: Number(bill.amount),
      type: bill.type,
      description: bill.description,
      date: dayjs(bill.date).format('YYYY-MM-DD'),
      categoryId: bill.categoryId,
      customerId: bill.customerId,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      if (editBill) {
        const updateData: UpdateBillRequest = {
          amount: values.amount,
          type: values.type,
          description: values.description,
          date: values.date,
          categoryId: values.categoryId,
          customerId: values.customerId,
        };
        await billsApi.updateBill(editBill.id, updateData);
        message.success('账单更新成功');
      } else {
        const createData: CreateBillRequest = {
          amount: values.amount,
          type: values.type,
          description: values.description,
          date: values.date,
          categoryId: values.categoryId,
          customerId: values.customerId,
        };
        await billsApi.createBill(createData);
        message.success('账单创建成功');
      }
      setModalOpen(false);
      fetchBills(pagination.page);
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (!error.errorFields) {
        message.error('操作失败');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await billsApi.deleteBill(id);
      message.success('删除成功');
      fetchBills(pagination.page);
    } catch {
      message.error('删除失败');
    }
  };

  // 批量结算
  const handleSettleBatch = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要结算的赊账记录');
      return;
    }
    setSettleModalOpen(true);
  };

  const confirmSettleBatch = async () => {
    setSettleLoading(true);
    try {
      const res = await billsApi.settleBatch({
        billIds: selectedRowKeys as number[],
        paymentMethod: settlePaymentMethod,
      });
      if (res.success) {
        message.success(`成功结算 ${res.data?.settledCount || 0} 笔赊账，总金额 ${(res.data?.totalAmount || 0).toFixed(2)} 元`);
        setSettleModalOpen(false);
        setSelectedRowKeys([]);
        fetchBills(pagination.page);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '批量结算失败');
    } finally {
      setSettleLoading(false);
    }
  };

  const billTypeTag = (type: string) => {
    switch (type) {
      case 'income': return <Tag color="green">收入</Tag>;
      case 'expense': return <Tag color="red">支出</Tag>;
      case 'credit': return <Tag color="orange">赊账</Tag>;
      default: return <Tag>{type}</Tag>;
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => billTypeTag(type),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      sorter: true,
      render: (amount: number, record: Bill) => (
        <span style={{ color: record.type === 'income' ? '#52c41a' : record.type === 'expense' ? '#ff4d4f' : '#fa8c16', fontWeight: 600 }}>
          {record.type === 'expense' ? '-' : '+'}{Number(amount).toFixed(2)}
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: Bill['category']) => category ? (
        <span>{category.icon} {category.name}</span>
      ) : '-',
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer',
      width: 100,
      render: (customer: Bill['customer'], record: Bill) => {
        if (record.type === 'credit') {
          return customer?.name || '-';
        }
        return '-';
      },
    },
    {
      title: '结算状态',
      key: 'settled',
      width: 100,
      render: (_: unknown, record: Bill) => {
        if (record.type !== 'credit') return '-';
        return record.isSettled
          ? <Tag color="green" icon={<CheckCircleOutlined />}>已结算</Tag>
          : <Tag color="volcano">未结算</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: Bill) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此账单？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const watchType = Form.useWatch('type', form);

  return (
    <div>
      {/* 筛选区 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="账单类型"
              allowClear
              style={{ width: '100%' }}
              value={filterType}
              onChange={setFilterType}
              options={[
                { label: '收入', value: 'income' },
                { label: '支出', value: 'expense' },
                { label: '赊账', value: 'credit' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="分类"
              allowClear
              style={{ width: '100%' }}
              value={filterCategoryId}
              onChange={setFilterCategoryId}
              options={categories.map((c) => ({ label: `${c.icon || ''} ${c.name}`, value: c.id }))}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="客户"
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              value={filterCustomerId}
              onChange={setFilterCustomerId}
              options={customers.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="结算状态"
              allowClear
              style={{ width: '100%' }}
              value={filterIsSettled}
              onChange={setFilterIsSettled}
              options={[
                { label: '已结算', value: true },
                { label: '未结算', value: false },
              ]}
            />
          </Col>
          <Col xs={24} sm={24} md={5}>
            <RangePicker
              style={{ width: '100%' }}
              value={filterDateRange as [dayjs.Dayjs, dayjs.Dayjs]}
              onChange={(dates) => setFilterDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
            />
          </Col>
          <Col xs={24} sm={24} md={3}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 账单表格 */}
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              新建账单
            </Button>
            {selectedRowKeys.length > 0 && (
              <Button
                icon={<CheckSquareOutlined />}
                onClick={handleSettleBatch}
                style={{ borderColor: '#fa8c16', color: '#fa8c16' }}
              >
                批量结算 ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
          <span style={{ color: '#999' }}>共 {pagination.total} 条记录</span>
        </div>

        <Table
          dataSource={bills}
          columns={columns}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record: Bill) => ({
              disabled: record.type !== 'credit' || record.isSettled,
            }),
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page) => fetchBills(page),
          }}
          size="middle"
        />
      </Card>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editBill ? '编辑账单' : '新建账单'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={modalLoading}
        width={520}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="账单类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select
                  options={[
                    { label: '收入', value: 'income' },
                    { label: '支出', value: 'expense' },
                    { label: '赊账', value: 'credit' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber
                  min={0.01}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="请输入金额"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item name="categoryId" label="分类">
            <Select
              allowClear
              placeholder="请选择分类"
              options={categories.map((c) => ({ label: `${c.icon || ''} ${c.name}`, value: c.id }))}
            />
          </Form.Item>
          {watchType === 'credit' && (
            <Form.Item
              name="customerId"
              label="客户"
              rules={watchType === 'credit' ? [{ required: true, message: '赊账必须选择客户' }] : []}
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="请选择客户"
                options={customers.map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
          )}
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="请输入描述（选填）" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量结算弹窗 */}
      <Modal
        title="批量结算赊账"
        open={settleModalOpen}
        onOk={confirmSettleBatch}
        onCancel={() => setSettleModalOpen(false)}
        confirmLoading={settleLoading}
        okText="确认结算"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <p>已选择 <strong>{selectedRowKeys.length}</strong> 笔赊账记录进行结算</p>
          <div style={{ marginTop: 8 }}>
            <span>还款方式：</span>
            <Select
              value={settlePaymentMethod}
              onChange={setSettlePaymentMethod}
              style={{ width: 200 }}
              options={[
                { label: '现金', value: '现金' },
                { label: '微信转账', value: '微信转账' },
                { label: '银行转账', value: '银行转账' },
                { label: '支付宝', value: '支付宝' },
                { label: '其他', value: '其他' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Bills;
