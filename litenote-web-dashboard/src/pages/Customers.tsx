import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Space, Input, Modal, Form, message, Popconfirm, Tag,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined,
} from '@ant-design/icons';
import { customersApi } from '../api/customers';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../types';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (search?: string) => {
    setLoading(true);
    try {
      const res = await customersApi.getCustomers({
        search: search || searchKeyword || undefined,
      });
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch {
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers();
  };

  const openCreateModal = () => {
    setEditCustomer(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditCustomer(customer);
    form.setFieldsValue({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      if (editCustomer) {
        const updateData: UpdateCustomerRequest = {
          name: values.name,
          phone: values.phone,
          address: values.address,
          notes: values.notes,
        };
        await customersApi.updateCustomer(editCustomer.id, updateData);
        message.success('客户更新成功');
      } else {
        const createData: CreateCustomerRequest = {
          name: values.name,
          phone: values.phone,
          address: values.address,
          notes: values.notes,
        };
        await customersApi.createCustomer(createData);
        message.success('客户创建成功');
      }
      setModalOpen(false);
      fetchCustomers();
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
      await customersApi.deleteCustomer(id);
      message.success('删除成功');
      fetchCustomers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Customer) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/customers/${record.id}`)}>
          {name}
        </Button>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string | null) => address || '-',
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string | null) => notes || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Customer) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/customers/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此客户？"
            description="删除后关联的赊账记录仍会保留"
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

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="搜索客户名称或电话"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 280 }}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建客户
          </Button>
        </div>

        <Table
          dataSource={customers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 条`,
          }}
          size="middle"
        />
      </Card>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editCustomer ? '编辑客户' : '新建客户'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={modalLoading}
        width={520}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" maxLength={100} />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话（选填）" maxLength={20} />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址（选填）" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
