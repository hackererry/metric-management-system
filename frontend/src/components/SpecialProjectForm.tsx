/**
 * 专项项目表单组件 - 创建/编辑
 */
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Row, Col, Button, Space, message, Divider, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { SpecialProject, SpecialProjectFormData, SpecialProjectTargetFormData, PROJECT_STATUS_CONFIG } from '../types/specialProject';
import { specialProjectApi } from '../services/specialProjectApi';

interface SpecialProjectFormProps {
  visible: boolean;
  project: SpecialProject | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SpecialProjectForm: React.FC<SpecialProjectFormProps> = ({
  visible,
  project,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<SpecialProjectFormData>();
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState<SpecialProjectTargetFormData[]>([]);

  const isEdit = !!project;

  useEffect(() => {
    if (visible) {
      if (project) {
        form.setFieldsValue({
          sub_project: project.sub_project,
          responsible_person: project.responsible_person,
          project_manager: project.project_manager,
          budget_person_days: project.budget_person_days,
          budget_used_days: project.budget_used_days,
          status: project.status,
          remarks: project.remarks || undefined,
        });
        setTargets(project.targets.map(t => ({
          target_name: t.target_name,
          target_value: t.target_value,
          current_value: t.current_value,
          unit: t.unit || undefined,
          weight: t.weight,
        })));
      } else {
        form.resetFields();
        setTargets([]);
      }
    }
  }, [visible, project, form]);

  const handleAddTarget = () => {
    setTargets([...targets, { target_name: '', target_value: 0, current_value: 0, unit: '', weight: 1 }]);
  };

  const handleRemoveTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleTargetChange = (index: number, field: string, value: any) => {
    const newTargets = [...targets];
    (newTargets[index] as any)[field] = value;
    setTargets(newTargets);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const projectData: SpecialProjectFormData = {
        ...values,
        targets,
      };

      setLoading(true);
      if (isEdit) {
        await specialProjectApi.update(project.id, projectData);
        message.success('更新成功');
      } else {
        await specialProjectApi.create(projectData);
        message.success('创建成功');
      }
      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑专项项目' : '新增专项项目'}
      open={visible}
      onCancel={onClose}
      width={720}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sub_project" label="子项目" rules={[{ required: true, message: '请输入子项目名称' }]}>
              <Input placeholder="请输入子项目名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="responsible_person" label="责任人" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="project_manager" label="项目经理" rules={[{ required: true, message: '请输入项目经理' }]}>
              <Input placeholder="请输入项目经理" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="项目状态" initialValue="planning">
              <Select>
                {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => (
                  <Select.Option key={key} value={key}>
                    {config.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="budget_person_days"
              label="预算投入(人天)"
              rules={[{ required: true, message: '请输入预算投入' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="人天" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="budget_used_days" label="已使用(人天)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="人天" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="remarks" label="备注说明">
          <Input.TextArea rows={2} placeholder="请输入备注说明" />
        </Form.Item>

        {/* 目标管理 */}
        <Divider orientation="left">
          目标管理 {targets.length > 0 && `(${targets.length})`}
        </Divider>

        {targets.map((target, index) => (
          <Card key={index} size="small" style={{ marginBottom: 8 }}>
            <Row gutter={8} align="middle">
              <Col span={8}>
                <Input
                  placeholder="目标名称"
                  value={target.target_name}
                  onChange={(e) => handleTargetChange(index, 'target_name', e.target.value)}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="目标值"
                  value={target.target_value}
                  onChange={(value) => handleTargetChange(index, 'target_value', value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="当前值"
                  value={target.current_value}
                  onChange={(value) => handleTargetChange(index, 'current_value', value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <Input
                  placeholder="单位"
                  value={target.unit || ''}
                  onChange={(e) => handleTargetChange(index, 'unit', e.target.value)}
                />
              </Col>
              <Col span={2}>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveTarget(index)}
                />
              </Col>
            </Row>
          </Card>
        ))}

        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddTarget} block>
          添加目标
        </Button>
      </Form>
    </Modal>
  );
};

export default SpecialProjectForm;
