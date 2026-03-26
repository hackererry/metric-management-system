/**
 * 项目列表页面
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Progress,
  Modal,
  Empty,
  Spin,
  message,
  Popconfirm,
  Typography,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../services/api';
import { Project, ProjectStatus, PROJECT_STATUS_CONFIG } from '../types';
import ProjectForm from '../components/ProjectForm';

const { Title, Text, Paragraph } = Typography;

const ProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // 加载项目列表
  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await projectApi.getList({
        limit: 100,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      });
      setProjects(response.items);
      setTotal(response.total);
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  // 搜索
  const handleSearch = () => {
    loadProjects();
  };

  // 创建/编辑项目
  const handleSubmit = async (values: Parameters<typeof projectApi.create>[0]) => {
    try {
      if (editingProject) {
        await projectApi.update(editingProject.id, values);
        message.success('更新成功');
      } else {
        await projectApi.create(values);
        message.success('创建成功');
      }
      setFormVisible(false);
      setEditingProject(null);
      loadProjects();
    } catch (error) {
      throw error;
    }
  };

  // 删除项目
  const handleDelete = async (id: number) => {
    try {
      await projectApi.delete(id);
      message.success('删除成功');
      loadProjects();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '删除失败');
    }
  };

  // 获取状态标签颜色
  const getStatusColor = (status: ProjectStatus) => {
    return PROJECT_STATUS_CONFIG[status]?.color || '#0078D4';
  };

  // 获取状态标签文本
  const getStatusLabel = (status: ProjectStatus) => {
    return PROJECT_STATUS_CONFIG[status]?.label || status;
  };

  // 格式化日期
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  // 截断描述
  const truncateDescription = (text: string | null, maxLength: number = 80) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div>
      {/* 工具栏 */}
      <Space style={{ marginBottom: 16 }} size="middle">
        <Input
          placeholder="搜索项目名称、编码"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 250 }}
        />
        <Select
          placeholder="状态筛选"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          style={{ width: 150 }}
          allowClear
        >
          <Select.Option value="">全部</Select.Option>
          {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => (
            <Select.Option key={key} value={key}>
              {config.label}
            </Select.Option>
          ))}
        </Select>
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingProject(null);
            setFormVisible(true);
          }}
        >
          新建项目
        </Button>
      </Space>

      {/* 项目列表 */}
      {loading ? (
        <Spin />
      ) : projects.length === 0 ? (
        <Empty description="暂无项目数据" />
      ) : (
        <Row gutter={[16, 16]}>
          {projects.map((project) => (
            <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
              <Card
                hoverable
                style={{ height: '100%' }}
                styles={{ body: { padding: 16 } }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {/* 卡片头部 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Title level={5} style={{ margin: 0, flex: 1 }} ellipsis>
                    {project.name}
                  </Title>
                  <Tag color={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Tag>
                </div>

                {/* 项目编码 */}
                {project.code && (
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                    编码: {project.code}
                  </Text>
                )}

                {/* 时间范围 */}
                <div style={{ marginBottom: 8 }}>
                  <CalendarOutlined style={{ marginRight: 4, color: '#605E5C' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(project.start_date)} ~ {formatDate(project.end_date)}
                  </Text>
                </div>

                {/* 描述 */}
                <Paragraph
                  type="secondary"
                  style={{ fontSize: 12, marginBottom: 12 }}
                  ellipsis={{ rows: 2 }}
                >
                  {project.description || '暂无描述'}
                </Paragraph>

                {/* 指标数量和达成率 */}
                <div style={{ marginBottom: 8 }}>
                  <Space>
                    <FolderOutlined style={{ color: '#605E5C' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {project.metric_count || 0} 个指标
                    </Text>
                  </Space>
                </div>

                {/* 达成率进度条 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>达成率</Text>
                    <Text style={{ fontSize: 12, fontWeight: 500 }}>
                      {(project.achievement_rate || 0).toFixed(1)}%
                    </Text>
                  </div>
                  <Progress
                    percent={project.achievement_rate || 0}
                    strokeColor={(() => {
                      const rate = project.achievement_rate || 0;
                      if (rate >= 80) return '#107C10';
                      if (rate >= 60) return '#FFB900';
                      return '#D13438';
                    })()}
                    showInfo={false}
                  />
                </div>

                {/* 操作按钮 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid #E1DFDD',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Space>
                    <Tooltip title="编辑">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                          setFormVisible(true);
                        }}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="确定要删除该项目吗？"
                      description="删除后无法恢复，项目下的指标关联也会被删除。"
                      onConfirm={() => handleDelete(project.id)}
                    >
                      <Tooltip title="删除">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 项目表单弹窗 */}
      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingProject(null);
        }}
        footer={null}
        width={600}
      >
        <ProjectForm
          initialValues={editingProject ? {
            name: editingProject.name,
            code: editingProject.code || '',
            description: editingProject.description || '',
            status: editingProject.status,
            start_date: editingProject.start_date || undefined,
            end_date: editingProject.end_date || undefined,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormVisible(false);
            setEditingProject(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default ProjectPage;
