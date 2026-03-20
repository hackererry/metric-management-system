/**
 * 指标表单组件 - 用于新增和编辑指标
 */
import React, { useEffect } from 'react';
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
} from 'antd';
import { Metric, MetricFormData, CATEGORY_CONFIG, DATA_TYPE_CONFIG, METRIC_TYPE_CONFIG, Category, DataType, Trend, MetricType } from '../types';

const { TextArea } = Input;
const { Option } = Select;

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

  // 初始化表单值
  useEffect(() => {
    if (visible) {
      if (metric) {
        form.setFieldsValue({
          name: metric.name,
          code: metric.code,
          category: metric.category,
          metric_type: metric.metric_type || 'business',
          data_type: metric.data_type,
          unit: metric.unit || '',
          value: metric.value,
          target_value: metric.target_value,
          previous_value: metric.previous_value,
          trend: metric.trend,
          description: metric.description || '',
          is_active: metric.is_active,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true, metric_type: 'business' });
      }
    }
  }, [visible, metric, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values as MetricFormData);
      message.success(isEdit ? '更新成功' : '创建成功');
      onCancel();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑指标' : '新增指标'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={600}
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
              <Select placeholder="请选择分类">
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
              name="metric_type"
              label="指标类型"
              rules={[{ required: true, message: '请选择指标类型' }]}
            >
              <Select placeholder="请选择指标类型">
                {Object.entries(METRIC_TYPE_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <span style={{ color: config.color }}>●</span> {config.label}
                  </Option>
                ))}
              </Select>
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
            <Form.Item name="unit" label="单位">
              <Input placeholder="如: 人、万元、%" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="value"
              label="当前值"
              rules={[{ required: true, message: '请输入当前值' }]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="当前值" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="target_value" label="目标值">
              <InputNumber style={{ width: '100%' }} placeholder="目标值" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="previous_value" label="上一周期值">
              <InputNumber style={{ width: '100%' }} placeholder="用于计算环比" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="trend" label="趋势">
              <Select placeholder="请选择趋势" allowClear>
                <Option value="up">
                  <span style={{ color: '#52c41a' }}>↑ 上升</span>
                </Option>
                <Option value="down">
                  <span style={{ color: '#ff4d4f' }}>↓ 下降</span>
                </Option>
                <Option value="stable">
                  <span style={{ color: '#8c8c8c' }}>→ 持平</span>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="指标描述">
          <TextArea rows={3} placeholder="请输入指标描述" maxLength={500} />
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
