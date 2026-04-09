/**
 * 专项项目卡片组件 - Dashboard 展示
 */
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Tooltip, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { SpecialProject, PROJECT_STATUS_CONFIG } from '../types/specialProject';
import { specialProjectApi } from '../services/specialProjectApi';
import BudgetProgressBar from './BudgetProgressBar';
import SpecialProjectForm from './SpecialProjectForm';

const { Text } = Typography;

interface SpecialProjectCardProps {
  year: number;
}

const SpecialProjectCard: React.FC<SpecialProjectCardProps> = ({ year }) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<SpecialProject[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<SpecialProject | null>(null);

  useEffect(() => {
    loadProjects();
  }, [year]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await specialProjectApi.getList({ limit: 100 });
      setProjects(data.items);
    } catch (error: any) {
      message.error(error.message || '加载专项项目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setFormVisible(true);
  };

  const handleEdit = (project: SpecialProject) => {
    setEditingProject(project);
    setFormVisible(true);
  };

  const handleDelete = async (project: SpecialProject) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目"${project.sub_project}"吗？此操作将同时删除所有关联目标。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await specialProjectApi.delete(project.id);
          message.success('删除成功');
          loadProjects();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const handleFormSuccess = () => {
    setFormVisible(false);
    loadProjects();
  };

  // 表格列定义
  const columns = [
    {
      title: '子项目',
      dataIndex: 'sub_project',
      key: 'sub_project',
      width: 120,
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: '责任人',
      dataIndex: 'responsible_person',
      key: 'responsible_person',
      width: 80,
    },
    {
      title: '项目经理',
      dataIndex: 'project_manager',
      key: 'project_manager',
      width: 80,
    },
    {
      title: '预算投入',
      dataIndex: 'budget_person_days',
      key: 'budget_person_days',
      width: 100,
      render: (value: number) => `${value} 人天`,
    },
    {
      title: '预算使用进度',
      key: 'budget_progress',
      width: 180,
      render: (_: any, record: SpecialProject) => (
        <BudgetProgressBar
          budgetPersonDays={record.budget_person_days}
          budgetUsedDays={record.budget_used_days}
          budgetUsagePercent={record.budget_usage_percent}
          showPercent
          size="small"
        />
      ),
    },
    {
      title: '目标',
      key: 'targets',
      width: 200,
      render: (_: any, record: SpecialProject) => {
        if (!record.targets || record.targets.length === 0) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Space direction="vertical" size={2}>
            {record.targets.slice(0, 2).map((t) => (
              <div key={t.id}>
                <Text style={{ fontSize: 12 }}>{t.target_name}: </Text>
                <Text strong style={{ fontSize: 12, color: t.achievement_rate >= 100 ? '#107C10' : '#D13438' }}>
                  {t.current_value}/{t.target_value}{t.unit || ''}
                </Text>
              </div>
            ))}
            {record.targets.length > 2 && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                +{record.targets.length - 2} 更多
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '项目状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: keyof typeof PROJECT_STATUS_CONFIG) => {
        const config = PROJECT_STATUS_CONFIG[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 100,
      ellipsis: true,
      render: (text: string | null) => text ? <Tooltip title={text}><Text type="secondary">{text}</Text></Tooltip> : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: SpecialProject) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>专项项目</span>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleCreate}>
            新增项目
          </Button>
        </div>
      }
      style={{ marginBottom: 16 }}
      loading={loading}
    >
      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 个项目`,
        }}
        size="small"
        scroll={{ x: 1000 }}
      />

      <SpecialProjectForm
        visible={formVisible}
        project={editingProject}
        onClose={() => setFormVisible(false)}
        onSuccess={handleFormSuccess}
      />
    </Card>
  );
};

export default SpecialProjectCard;
