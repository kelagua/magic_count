import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Button, Tag, Spin, Typography } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  FileTextOutlined,
  TeamOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { billsApi } from '../api/bills';
import type { HomeStatistics, Bill, TopDebtor } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HomeStatistics | null>(null);

  useEffect(() => {
    fetchHomeStats();
  }, []);

  const fetchHomeStats = async () => {
    setLoading(true);
    try {
      const res = await billsApi.getHomeStatistics();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('获取首页统计失败', error);
    } finally {
      setLoading(false);
    }
  };

  const billTypeTag = (type: string) => {
    switch (type) {
      case 'income':
        return <Tag color="green">收入</Tag>;
      case 'expense':
        return <Tag color="red">支出</Tag>;
      case 'credit':
        return <Tag color="orange">赊账</Tag>;
      default:
        return <Tag>{type}</Tag>;
    }
  };

  const recentBillsColumns = [
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
      width: 100,
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
      render: (category: Bill['category']) => category?.name || '-',
    },
  ];

  const topDebtorsColumns = [
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '电话',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '欠款金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
          {Number(amount).toFixed(2)}
        </span>
      ),
    },
    {
      title: '赊账笔数',
      dataIndex: 'billCount',
      key: 'billCount',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: TopDebtor) => (
        <Button type="link" size="small" onClick={() => navigate(`/customers/${record.customerId}`)}>
          查看
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>仪表盘</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/bills')}>
            新建账单
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="本月营业额"
              value={stats?.totalRevenue || 0}
              precision={2}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="本月赊账"
              value={stats?.monthlyCredit || 0}
              precision={2}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="本月结清"
              value={stats?.monthlySettled || 0}
              precision={2}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="赊账笔数"
              value={stats?.unsettledCreditCount || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix="笔"
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col>
          <Button icon={<FileTextOutlined />} onClick={() => navigate('/bills')}>
            管理账单
          </Button>
        </Col>
        <Col>
          <Button icon={<TeamOutlined />} onClick={() => navigate('/customers')}>
            客户管理
          </Button>
        </Col>
        <Col>
          <Button icon={<DollarOutlined />} onClick={() => navigate('/statistics')}>
            统计分析
          </Button>
        </Col>
      </Row>

      {/* 最近账单和欠款客户 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="最近账单"
            extra={<Button type="link" onClick={() => navigate('/bills')}>查看全部</Button>}
          >
            <Table
              dataSource={stats?.recentBills || []}
              columns={recentBillsColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="欠款客户"
            extra={<Button type="link" onClick={() => navigate('/customers')}>查看全部</Button>}
          >
            <Table
              dataSource={stats?.topDebtors || []}
              columns={topDebtorsColumns}
              rowKey="customerId"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无欠款客户' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
