/**
 * 指标表单组件 - 用于新增和编辑指标
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Row,
  Col,
  message,
  Checkbox,
  Space,
  Button,
  Typography,
  Divider,
  Collapse,
  Alert,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import {
  Metric,
  MetricFormData,
  CATEGORY_CONFIG,
  DATA_TYPE_CONFIG,
  DIMENSION_CONFIG,
  SourceMetricOption,
  AggregationType,
} from '../types';
import { metricApi } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { Paragraph } = Typography;
const { Panel } = Collapse;

interface MetricFormProps {
  visible: boolean;
  metric?: Metric | null;
  onCancel: () => void;
  onSubmit: (data: MetricFormData) => Promise<void>;
}

const MetricForm: React.FC<MetricFormProps> = ({
  visible,
  metric,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!metric;
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [sourceOptions, setSourceOptions] = useState<SourceMetricOption[]>([]);
  // 简化的聚合配置：只存储选中的源指标ID列表
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
  // 统一的聚合类型和权重
  const [aggregationType, setAggregationType] = useState<AggregationType>('average');
  const [aggregationWeight, setAggregationWeight] = useState<number>(1.0);
  // 聚合配置启用开关（仅总览指标）
  const [aggregationEnabled, setAggregationEnabled] = useState<boolean>(false);
  const [loadingSources, setLoadingSources] = useState(false);

  // 过滤状态
  const [filterLowerIsBetter, setFilterLowerIsBetter] = useState<boolean | undefined>(undefined);
  const [filterUnit, setFilterUnit] = useState<string | undefined>(undefined);
  const [filterDataType, setFilterDataType] = useState<string | undefined>(undefined);
  const [filterDimension, setFilterDimension] = useState<string | undefined>(undefined);

  // 加载可选的源指标列表
  const loadSourceOptions = async () => {
    setLoadingSources(true);
    try {
      const options = await metricApi.getSourceMetricOptions();
      setSourceOptions(options);
    } catch (error: any) {
      console.error('加载源指标列表失败', error);
    } finally {
      setLoadingSources(false);
    }
  };

  // 加载已有关联的聚合配置（编辑时）
  const loadExistingConfigs = async (metricId: number) => {
    try {
      const configs = await metricApi.getAggregationConfigs(metricId);
      if (configs.length > 0) {
        // 使用第一个配置的聚合类型和权重作为统一配置
        setAggregationType(configs[0].aggregation_type as AggregationType);
        setAggregationWeight(configs[0].weight);
        // 提取所有源指标ID
        setSelectedSourceIds(configs.map(c => c.source_metric_id));
        // 启用聚合配置开关
        setAggregationEnabled(true);
      }
    } catch (error: any) {
      console.error('加载聚合配置失败', error);
    }
  };

  // 初始化表单值
  useEffect(() => {
    if (visible) {
      loadSourceOptions();
      if (metric) {
        setSelectedCategory(metric.category);
        // 设置过滤条件
        setFilterLowerIsBetter(metric.lower_is_better);
        setFilterUnit(metric.unit || undefined);
        setFilterDataType(metric.data_type);
        setFilterDimension(metric.dimension);
        form.setFieldsValue({
          name: metric.name,
          code: metric.code,
          category: metric.category,
          data_type: metric.data_type,
          dimension: metric.dimension,
          lower_is_better: metric.lower_is_better !== undefined ? metric.lower_is_better : true,
          unit: metric.unit || '',
          target_value: metric.target_value,
          challenge_value: metric.challenge_value,
          aggregation_type: metric.aggregation_type || 'average',
          data_source_link: metric.data_source_link || '',
          description: metric.description || '',
          is_active: metric.is_active,
        });
        // 加载已有的聚合配置
        if (metric.category === 'overview') {
          loadExistingConfigs(metric.id);
        }
      } else {
        setSelectedCategory(undefined);
        setSelectedSourceIds([]);
        setAggregationType('average');
        setAggregationWeight(1.0);
        setAggregationEnabled(false);
        setFilterLowerIsBetter(undefined);
        setFilterUnit(undefined);
        setFilterDataType(undefined);
        setFilterDimension(undefined);
        form.resetFields();
        form.setFieldsValue({ is_active: true, lower_is_better: true, aggregation_type: 'average' });
      }
    }
  }, [visible, metric, form]);

  // 处理分类变化
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSourceIds([]); // 清空已选指标
  };

  // 处理过滤条件变化
  const handleFilterChange = (field: 'lower_is_better' | 'unit' | 'data_type' | 'dimension', value: any) => {
    if (field === 'lower_is_better') {
      setFilterLowerIsBetter(value);
    } else if (field === 'unit') {
      setFilterUnit(value || undefined);
    } else if (field === 'data_type') {
      setFilterDataType(value || undefined);
    } else if (field === 'dimension') {
      setFilterDimension(value || undefined);
    }
  };

  // 计算过滤后的选项
  const filteredSourceOptions = useMemo(() => {
    return sourceOptions.filter(opt => {
      const matchLowerBetter = filterLowerIsBetter === undefined || opt.lower_is_better === filterLowerIsBetter;
      const matchUnit = !filterUnit || opt.unit === filterUnit || opt.unit === null;
      const matchDataType = !filterDataType || opt.data_type === filterDataType;
      const matchDimension = !filterDimension || opt.dimension === filterDimension;
      return matchLowerBetter && matchUnit && matchDataType && matchDimension;
    });
  }, [sourceOptions, filterLowerIsBetter, filterUnit, filterDataType, filterDimension]);

  // 按分类分组
  const groupedOptions = useMemo(() => {
    const groups: Record<string, SourceMetricOption[]> = {
      product_a: [],
      product_b: [],
      product_c: [],
      product_d: [],
    };
    filteredSourceOptions.forEach(opt => {
      if (groups[opt.category]) {
        groups[opt.category].push(opt);
      }
    });
    return groups;
  }, [filteredSourceOptions]);

  // 处理源指标选择变化
  const handleSourceToggle = (metricId: number, checked: boolean) => {
    if (checked) {
      setSelectedSourceIds(prev => [...prev, metricId]);
    } else {
      setSelectedSourceIds(prev => prev.filter(id => id !== metricId));
    }
  };

  // 检查指标是否被选中
  const isSourceSelected = (metricId: number) => {
    return selectedSourceIds.includes(metricId);
  };

  // 删除源指标
  const handleRemoveSource = (sourceId: number) => {
    setSelectedSourceIds(prev => prev.filter(id => id !== sourceId));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 如果是 overview 指标，附加 source_configs
      if (values.category === 'overview' && selectedSourceIds.length > 0) {
        // 构建统一的聚合配置
        values.source_configs = selectedSourceIds.map(id => ({
          source_metric_id: id,
          aggregation_type: aggregationType,
          weight: aggregationWeight,
        }));
      }
      await onSubmit(values as MetricFormData);
      message.success(isEdit ? '更新成功' : '创建成功');
      onCancel();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 是否配置了聚合来源（有来源时禁止手动编辑数据）
  const hasSourceConfigs = selectedCategory === 'overview' && selectedSourceIds.length > 0;

  // 获取源指标名称
  const getSourceName = (id: number) => {
    const source = sourceOptions.find(s => s.id === id);
    return source ? `${source.name} (${CATEGORY_CONFIG[source.category]?.label})` : `指标${id}`;
  };

  return (
    <Modal
      title={isEdit ? '编辑指标' : '新增指标'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={750}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ is_active: true }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="指标名称"
              rules={[
                { required: true, message: '请输入指标名称' },
                { max: 100, message: '名称不能超过100个字符' },
              ]}
            >
              <Input placeholder="请输入指标名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="code"
              label="指标编码"
              rules={[
                { required: true, message: '请输入指标编码' },
                { max: 50, message: '编码不能超过50个字符' },
                {
                  pattern: /^[a-zA-Z0-9_-]+$/,
                  message: '编码只能包含字母、数字、下划线和连字符',
                },
              ]}
            >
              <Input placeholder="如: total_users" disabled={isEdit} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="category"
              label="所属分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select
                placeholder="请选择分类"
                onChange={handleCategoryChange}
                disabled={isEdit}
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <span style={{ color: config.color }}>●</span> {config.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dimension"
              label="维度"
              rules={[{ required: true, message: '请选择维度' }]}
            >
              <Select placeholder="请选择维度">
                {Object.entries(DIMENSION_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <span style={{ color: config.color }}>●</span> {config.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 来源指标配置区域（仅 overview 指标显示，且启用了聚合配置） */}
        {selectedCategory === 'overview' && (
          <>
            <Divider orientation="left">
              聚合配置
              <Switch
                size="small"
                checked={aggregationEnabled}
                onChange={setAggregationEnabled}
                checkedChildren="启用"
                unCheckedChildren="停用"
                style={{ marginLeft: 12 }}
              />
            </Divider>
            {aggregationEnabled && (
              <>
                <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  选择子产品指标，这些指标的值将聚合到当前产品部指标
                </Paragraph>

                {/* 统一的聚合方式配置 */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Form.Item label="聚合方式" style={{ marginBottom: 8 }}>
                      <Select
                        value={aggregationType}
                    onChange={(val) => setAggregationType(val)}
                    style={{ width: '100%' }}
                  >
                    <Option value="sum">求和 (sum)</Option>
                    <Option value="average">平均 (avg)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="权重" style={{ marginBottom: 8 }}>
                  <InputNumber
                    value={aggregationWeight}
                    min={0}
                    max={10}
                    step={0.1}
                    onChange={(val) => setAggregationWeight(val || 1)}
                    style={{ width: '100%' }}
                    placeholder="统一权重"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 过滤条件区域 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Form.Item
                  name="filter_lower_is_better"
                  label="达标条件"
                  style={{ marginBottom: 8 }}
                >
                  <Select
                    placeholder="达标条件"
                    allowClear
                    onChange={(val) => handleFilterChange('lower_is_better', val)}
                  >
                    <Option value={true}>
                      <span style={{ color: '#52c41a' }}>↓ 越小越好</span>
                    </Option>
                    <Option value={false}>
                      <span style={{ color: '#1890ff' }}>↑ 越大越好</span>
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="filter_data_type"
                  label="数据类型"
                  style={{ marginBottom: 8 }}
                >
                  <Select
                    placeholder="数据类型"
                    allowClear
                    onChange={(val) => handleFilterChange('data_type', val)}
                  >
                    {Object.entries(DATA_TYPE_CONFIG).map(([key, config]) => (
                      <Option key={key} value={key}>
                        {config.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="filter_dimension"
                  label="维度"
                  style={{ marginBottom: 8 }}
                >
                  <Select
                    placeholder="维度"
                    allowClear
                    onChange={(val) => handleFilterChange('dimension', val)}
                  >
                    {Object.entries(DIMENSION_CONFIG).map(([key, config]) => (
                      <Option key={key} value={key}>
                        <span style={{ color: config.color }}>●</span> {config.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="filter_unit"
                  label="单位"
                  style={{ marginBottom: 8 }}
                >
                  <Input
                    placeholder="单位"
                    onChange={(e) => handleFilterChange('unit', e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 分组展示的可选来源指标 */}
            <Form.Item label="选择来源指标">
              {loadingSources ? (
                <Paragraph>加载中...</Paragraph>
              ) : (
                <Collapse defaultActiveKey={[]}>
                  {Object.entries(groupedOptions).map(([cat, opts]) => {
                    if (opts.length === 0) return null;
                    return (
                      <Panel
                        key={cat}
                        header={
                          <span>
                            <span style={{ color: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.color }}>
                              ●
                            </span>{' '}
                            {CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label}
                            <span style={{ color: '#8c8c8c', marginLeft: 8 }}>
                              ({opts.length}个指标)
                            </span>
                          </span>
                        }
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {opts.map(opt => (
                            <Checkbox
                              key={opt.id}
                              checked={isSourceSelected(opt.id)}
                              onChange={(e) => handleSourceToggle(opt.id, e.target.checked)}
                            >
                              {opt.name}
                            </Checkbox>
                          ))}
                        </div>
                      </Panel>
                    );
                  })}
                </Collapse>
              )}
            </Form.Item>

            {/* 已选来源指标列表 */}
            {selectedSourceIds.length > 0 && (
              <Form.Item label="已选指标">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedSourceIds.map(id => (
                    <Row key={id} gutter={8} align="middle">
                      <Col span={18}>
                        <span>{getSourceName(id)}</span>
                      </Col>
                      <Col span={6}>
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveSource(id)}
                        >
                          移除
                        </Button>
                      </Col>
                    </Row>
                  ))}
                </Space>
              </Form.Item>
            )}

            {/* 提示信息 */}
            {hasSourceConfigs && (
              <Alert
                message="已配置子产品数据来源，实际值、达标值等数据将由聚合计算自动生成，无需手动填写"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
              </>
            )}
          </>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="lower_is_better"
              label="达标条件"
            >
              <Select placeholder="请选择达标条件">
                <Option value={true}>
                  <span style={{ color: '#52c41a' }}>↓ 越小越好</span>
                </Option>
                <Option value={false}>
                  <span style={{ color: '#1890ff' }}>↑ 越大越好</span>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="unit" label="单位">
              <Input placeholder="如: 人、万元、%" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="data_type"
              label="数据类型"
              rules={[{ required: true, message: '请选择数据类型' }]}
            >
              <Select placeholder="请选择数据类型">
                {Object.entries(DATA_TYPE_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    {config.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="aggregation_type"
              label="年度汇总方式"
            >
              <Select placeholder="请选择汇总方式">
                <Option value="average">
                  <span>平均 (average)</span>
                </Option>
                <Option value="sum">
                  <span>求和 (sum)</span>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="target_value" label="达标值">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="达标值"
                disabled={hasSourceConfigs}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="challenge_value" label="挑战值">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="挑战值（可选）"
                disabled={hasSourceConfigs}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="指标描述">
          <TextArea rows={3} placeholder="请输入指标描述" maxLength={500} />
        </Form.Item>

        <Form.Item name="data_source_link" label="数据来源链接">
          <Input placeholder="请输入数据来源链接，如: https://example.com/dashboard" />
        </Form.Item>

        <Form.Item
          name="is_active"
          label="是否启用"
          valuePropName="checked"
        >
          <Switch checkedChildren="启用" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MetricForm;
