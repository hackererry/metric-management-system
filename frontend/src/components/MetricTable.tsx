/**
 * 指标列表组件 - 表格展示和管理指标
 */
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Switch,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Metric,
  Category,
  Dimension,
  CATEGORY_CONFIG,
  DATA_TYPE_CONFIG,
  DIMENSION_CONFIG,
  MetricFormData,
} from '../types';
import { metricApi } from '../services/api';
import MetricForm from './MetricForm';
import { hasWritePermission, getIPPermission } from '../services/ipAuth';

const { Option } = Select;
const { Search } = Input;

const MetricTable: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | undefined>();
  const [dimensionFilter, setDimensionFilter] = useState<Dimension | undefined>();
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  const [formVisible, setFormVisible] = useState(false);
  const [currentMetric, setCurrentMetric] = useState<Metric | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [categoryPermissions, setCategoryPermissions] = useState<Record<string, boolean>>({});

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await metricApi.getList({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        keyword: keyword || undefined,
        category: categoryFilter,
        dimension: dimensionFilter || undefined,
        is_active: statusFilter,
      });
      setMetrics(response.items);
      setTotal(response.total);
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载IP权限
  const loadPermissions = async () => {
    const permission = await getIPPermission();
    setCanWrite(permission.is_whitelisted);

    // 为每个分类检查写权限
    const categoryPerms: Record<string, boolean> = {};
    const categories = ['overview', 'product_a', 'product_b', 'product_c', 'product_d'];
    for (const cat of categories) {
      categoryPerms[cat] = permission.is_whitelisted &&
        (permission.permissions.includes('all') || permission.permissions.includes(cat));
    }
    setCategoryPermissions(categoryPerms);
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword, categoryFilter, dimensionFilter, statusFilter]);

  // 筛选变化时重置页码
  useEffect(() => {
    setPage(1);
  }, [keyword, categoryFilter, dimensionFilter, statusFilter]);

  // 删除指标
  const handleDelete = async (id: number, category: string) => {
    if (!categoryPermissions[category]) {
      message.error('当前IP没有对该分类指标的写权限');
      return;
    }
    try {
      await metricApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 切换状态
  const handleToggleStatus = async (metric: Metric) => {
    if (!categoryPermissions[metric.category]) {
      message.error('当前IP没有对该分类指标的写权限');
      return;
    }
    try {
      await metricApi.update(metric.id, { is_active: !metric.is_active });
      message.success('状态更新成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  // 提交表单
  const handleSubmit = async (data: MetricFormData) => {
    if (currentMetric) {
      await metricApi.update(currentMetric.id, data);
    } else {
      await metricApi.create(data);
    }
    loadData();
  };

  // 打开编辑表单
  const handleEdit = (metric: Metric) => {
    if (!categoryPermissions[metric.category]) {
      message.error('当前IP没有对该分类指标的写权限');
      return;
    }
    setCurrentMetric(metric);
    setFormVisible(true);
  };

  // 打开新增表单
  const handleAdd = () => {
    if (!canWrite) {
      message.error('当前IP没有写权限');
      return;
    }
    setCurrentMetric(null);
    setFormVisible(true);
  };

  // 检查是否有任意分类的写权限
  const hasAnyWritePermission = () => {
    return Object.values(categoryPermissions).some(v => v);
  };

  // 表格列定义
  const columns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: Metric) => (
        <span>{text}</span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (category: Category) => {
        const config = CATEGORY_CONFIG[category];
        return <Tag color={config.color} style={{ borderRadius: 4, marginRight: 0 }}>{config.label}</Tag>;
      },
    },
    {
      title: '维度',
      dataIndex: 'dimension',
      key: 'dimension',
      width: 70,
      render: (dimension: Dimension) => {
        const config = DIMENSION_CONFIG[dimension];
        return config ? <Tag color={config.color} style={{ borderRadius: 4, marginRight: 0 }}>{config.label}</Tag> : '-';
      },
    },
    {
      title: '数据类型',
      dataIndex: 'data_type',
      key: 'data_type',
      width: 80,
      render: (type: string) => DATA_TYPE_CONFIG[type as keyof typeof DATA_TYPE_CONFIG]?.label || type,
    },
    {
      title: '达标值',
      dataIndex: 'target_value',
      key: 'target_value',
      width: 100,
      render: (value: number | null, record: Metric) => {
        if (value === null || value === undefined) return '-';
        const display =
          record.data_type === 'percentage'
            ? `${value.toFixed(1)}%`
            : record.unit
            ? `${value.toLocaleString()} ${record.unit}`
            : value.toLocaleString();
        return display;
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 60,
      render: (active: boolean, record: Metric) => (
        <Switch
          checked={active}
          onChange={() => handleToggleStatus(record)}
          size="small"
          disabled={!categoryPermissions[record.category]}
          style={{ backgroundColor: active ? '#107C10' : '#C8C6C4' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Metric) => {
        const hasPermission = categoryPermissions[record.category];
        return (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={!hasPermission}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除此指标吗？"
              onConfirm={() => handleDelete(record.id, record.category)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!hasPermission}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card>
      {/* 工具栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Search
            placeholder="搜索指标名称/描述"
            allowClear
            onSearch={setKeyword}
            enterButton={<SearchOutlined />}
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="分类筛选"
            allowClear
            style={{ width: '100%' }}
            onChange={setCategoryFilter}
          >
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <Option key={key} value={key}>
                <span style={{ color: config.color }}>●</span> {config.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="维度筛选"
            allowClear
            style={{ width: '100%' }}
            onChange={setDimensionFilter}
          >
            {Object.entries(DIMENSION_CONFIG).map(([key, config]) => (
              <Option key={key} value={key}>
                <span style={{ color: config.color }}>●</span> {config.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: '100%' }}
            onChange={setStatusFilter}
          >
            <Option value={true}>启用</Option>
            <Option value={false}>停用</Option>
          </Select>
        </Col>
        <Col span={7} style={{ textAlign: 'right' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            {hasAnyWritePermission() && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增指标
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={metrics}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 800 }}
      />

      {/* 表单弹窗 */}
      <MetricForm
        visible={formVisible}
        metric={currentMetric}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleSubmit}
        categoryPermissions={categoryPermissions}
      />
    </Card>
  );
};

export default MetricTable;
