import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Spin, Select, Typography, Tag } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { billsApi } from '../api/bills';
import type { StatisticsData, CategoryStat } from '../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
  '#ff7a45', '#9254de',
];

const Statistics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      fetchStatistics();
    }
  }, [dateRange, granularity]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const res = await billsApi.getStatistics({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        granularity,
      });
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('获取统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 饼图数据
  const renderPieChart = (
    data: CategoryStat[],
    title: string,
    totalAmount: number,
  ) => (
    <Card title={title}>
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="amount"
                  nameKey="categoryName"
                  label={({ categoryName, percentage }) =>
                    `${categoryName} ${percentage}%`
                  }
                  labelLine={true}
                >
                  {data.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)} 元`}
                />
              </PieChart>
            </ResponsiveContainer>
          </Col>
          <Col xs={24} md={10}>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {data.map((item, index) => (
                <div
                  key={item.categoryId || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: COLORS[index % COLORS.length],
                      marginRight: 8,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 13 }}>
                    {item.categoryIcon} {item.categoryName}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginRight: 8 }}>
                    {item.amount.toFixed(2)}
                  </span>
                  <Tag color={COLORS[index % COLORS.length]} style={{ margin: 0 }}>
                    {item.percentage}%
                  </Tag>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      )}
    </Card>
  );

  // 月度趋势图
  const renderMonthlyTrend = () => {
    const data = stats?.monthlyTrends || [];
    if (data.length === 0) return null;

    return (
      <Card title="月度收支趋势">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value.toFixed(2)} 元`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              name="收入"
              stroke="#52c41a"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="支出"
              stroke="#ff4d4f"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  // 每日趋势图
  const renderDailyTrend = () => {
    const data = stats?.dailyTrends || [];
    if (data.length === 0) return null;

    return (
      <Card title="每日收支趋势">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date: string) => dayjs(date).format('MM/DD')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date: string) => dayjs(date).format('YYYY-MM-DD')}
              formatter={(value: number) => `${value.toFixed(2)} 元`}
            />
            <Legend />
            <Bar dataKey="income" name="收入" fill="#52c41a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="expense" name="支出" fill="#ff4d4f" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <Title level={4} style={{ margin: 0 }}>统计分析</Title>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
          />
          <Select
            value={granularity}
            onChange={setGranularity}
            style={{ width: 120 }}
            options={[
              { label: '按日', value: 'daily' },
              { label: '按月', value: 'monthly' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" tip="加载统计数据中..." />
        </div>
      ) : (
        <>
          {/* 汇总卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card hoverable>
                <Statistic
                  title="总收入"
                  value={stats?.totalIncome || 0}
                  precision={2}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable>
                <Statistic
                  title="总支出"
                  value={stats?.totalExpense || 0}
                  precision={2}
                  prefix={<FallOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable>
                <Statistic
                  title="结余"
                  value={stats?.balance || 0}
                  precision={2}
                  prefix={<WalletOutlined />}
                  valueStyle={{ color: (stats?.balance || 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
                  suffix="元"
                />
              </Card>
            </Col>
          </Row>

          {/* 分类饼图 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              {renderPieChart(
                stats?.expenseCategoryStats || [],
                '支出分类占比',
                stats?.totalExpense || 0,
              )}
            </Col>
            <Col xs={24} lg={12}>
              {renderPieChart(
                stats?.incomeCategoryStats || [],
                '收入分类占比',
                stats?.totalIncome || 0,
              )}
            </Col>
          </Row>

          {/* 趋势图 */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {granularity === 'monthly' ? renderMonthlyTrend() : renderDailyTrend()}
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Statistics;
