/**
 * 项目表单组件
 */
import React from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  message,
} from 'antd';
import { ProjectFormData, ProjectStatus, PROJECT_STATUS_CONFIG } from '../types';

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormData>;
  onSubmit: (values: ProjectFormData) => Promise<void>;
  onCancel?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      const err = error as Error;
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        name="name"
        label="项目名称"
        rules={[{ required: true, message: '请输入项目名称' }]}
      >
        <Input placeholder="请输入项目名称" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="code"
        label="项目编码"
        rules={[
          { required: false },
          { pattern: /^[a-zA-Z0-9_-]+$/, message: '编码只能包含字母、数字、下划线和连字符' },
        ]}
      >
        <Input placeholder="请输入项目编码（唯一标识）" maxLength={50} />
      </Form.Item>

      <Form.Item
        name="description"
        label="项目描述"
      >
        <Input.TextArea
          placeholder="请输入项目描述"
          rows={4}
          maxLength={500}
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="项目状态"
        initialValue="active"
      >
        <Select>
          {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => (
            <Select.Option key={key} value={key}>
              {config.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="start_date"
        label="开始日期"
      >
        <DatePicker
          style={{ width: '100%' }}
          placeholder="请选择开始日期"
          format="YYYY-MM-DD"
        />
      </Form.Item>

      <Form.Item
        name="end_date"
        label="结束日期"
      >
        <DatePicker
          style={{ width: '100%' }}
          placeholder="请选择结束日期"
          format="YYYY-MM-DD"
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? '更新' : '创建'}
          </Button>
          {onCancel && (
            <Button style={{ marginLeft: 8 }} onClick={onCancel}>
              取消
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProjectForm;
