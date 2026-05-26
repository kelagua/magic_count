import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Table, Button, Tag, Space, Spin, Statistic, Row, Col,
  Modal, Select, message, Typography,
} from 'antd';
import {
  ArrowLeftOutlined, PhoneOutlined, EnvironmentOutlined,
  CheckCircleOutlined, CheckSquareOutlined, DollarOutlined,
} from '@ant-design/icons';
import { customersApi } from '../api/customers';
import { billsApi } from '../api/bills';
import type { Customer, Bill, Pagination } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [billsLoading, setBillsLoading] = useState(false);

  // 未结算赊账
  const [unsettledBills, setUnsettledBills] = useState<Bill[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState('现金');
  const [settleLoading, setSettleLoading] = useState(false);

  // 筛选
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterIsSettled, setFilterIsSettled] = useState<boolean | undefined>();

  useEffect(() => {
    if (id) {
      fetchCustomer();
      fetchBills();
      fetchUnsettledBills();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const res = await customersApi.getCustomer(Number(id));
      if (res.success && res.data) {
        setCustomer(res.data);
      }
    } catch {
      message.error('获取客户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async (page = 1) => {
    setBillsLoading(true);
    try {
      const res = await customersApi.getCustomerBills(Number(id), {
        page,
        limit: pagination.limit,
        type: filterType,
        isSettled: filterIsSettled,
      });
      if (res.success) {
        setBills(res.data ?? []);
        setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch {
      message.error('获取客户账单失败');
    } finally {
      setBillsLoading(false);
    }
  };

  const fetchUnsettledBills = async () => {
    try {
      const res = await customersApi.getCustomerBills(Number(id), {
        type: 'entry',
        isSettled: false,
        limit: 100,
      });
      if (res.success && res.data) {
        setUnsettledBills(res.data ?? []);
      }
    } catch { /* ignore */ }
  };

  const handleSettleBatch = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要结清的入账记录');
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
        message.success(`成功结清 ${res.data?.settledCount || 0} 笔入账，总金额 ${(res.data?.totalAmount || 0).toFixed(2)} 元`);
        setSettleModalOpen(false);
        setSelectedRowKeys([]);
        fetchBills(pagination.page);
        fetchUnsettledBills();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '批量结算失败');
    } finally {
      setSettleLoading(false);
    }
  };

  const billTypeTag = (type: string) => {
    switch (type) {
      case 'entry': return <Tag color="green">入账</Tag>;
      case 'expense': return <Tag color="red">支出</Tag>;
      case 'settlement': return <Tag color="blue">结清</Tag>;
      default: return <Tag>{type}</Tag>;
    }
  };

  const totalUnsettled = unsettledBills.reduce((sum, b) => sum + Number(b.amount), 0);

  const billColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
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
      render: (amount: number, record: Bill) => (
        <span style={{ color: record.type === 'entry' ? '#52c41a' : record.type === 'expense' ? '#ff4d4f' : '#1890ff', fontWeight: 600 }}>
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
      render: (category: Bill['category']) => category ? `${category.icon || ''} ${category.name}` : '-',
    },
    {
      title: '结算状态',
      key: 'settled',
      width: 100,
      render: (_: unknown, record: Bill) => {
        if (record.type !== 'entry') return '-';
        return record.isSettled
          ? <Tag color="green" icon={<CheckCircleOutlined />}>已结清</Tag>
          : <Tag color="volcano">未结清</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/customers')}
        style={{ marginBottom: 16 }}
      >
        返回客户列表
      </Button>

      {/* 客户信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={16}>
            <Descriptions title={customer?.name} column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="电话">
                <Space>
                  <PhoneOutlined />
                  {customer?.phone || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="地址">
                <Space>
                  <EnvironmentOutlined />
                  {customer?.address || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="备注">{customer?.notes || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {customer?.createdAt ? new Date(customer.createdAt).toLocaleString('zh-CN') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="未结清总额"
                value={totalUnsettled}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: totalUnsettled > 0 ? '#fa8c16' : '#52c41a' }}
                suffix="元"
              />
              <div style={{ marginTop: 8, color: '#999' }}>
                共 {unsettledBills.length} 笔未结清入账
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 未结清入账 - 批量结清 */}
      {unsettledBills.length > 0 && (
        <Card
          title="未结清入账"
          style={{ marginBottom: 16 }}
          extra={
            selectedRowKeys.length > 0 ? (
              <Button
                icon={<CheckSquareOutlined />}
                onClick={handleSettleBatch}
                style={{ borderColor: '#fa8c16', color: '#fa8c16' }}
              >
                批量结清 ({selectedRowKeys.length})
              </Button>
            ) : null
          }
        >
          <Table
            dataSource={unsettledBills}
            columns={[
              ...billColumns,
            ]}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
          />
        </Card>
      )}

      {/* 全部账单 */}
      <Card
        title="全部账单"
        extra={
          <Space>
            <Select
              placeholder="账单类型"
              allowClear
              style={{ width: 120 }}
              value={filterType}
              onChange={(val) => { setFilterType(val); }}
              options={[
                { label: '入账', value: 'entry' },
                { label: '支出', value: 'expense' },
                { label: '结清', value: 'settlement' },
              ]}
            />
            <Select
              placeholder="结算状态"
              allowClear
              style={{ width: 120 }}
              value={filterIsSettled}
              onChange={(val) => { setFilterIsSettled(val); }}
              options={[
                { label: '已结清', value: true },
                { label: '未结清', value: false },
              ]}
            />
            <Button type="primary" onClick={() => fetchBills(1)}>筛选</Button>
          </Space>
        }
      >
        <Table
          dataSource={bills}
          columns={billColumns}
          rowKey="id"
          loading={billsLoading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page) => fetchBills(page),
          }}
          size="middle"
        />
      </Card>

      {/* 批量结清弹窗 */}
      <Modal
        title="批量结清入账"
        open={settleModalOpen}
        onOk={confirmSettleBatch}
        onCancel={() => setSettleModalOpen(false)}
        confirmLoading={settleLoading}
        okText="确认结清"
        cancelText="取消"
      >
        <div>
          <p>已选择 <strong>{selectedRowKeys.length}</strong> 笔入账记录进行结清</p>
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

export default CustomerDetail;
