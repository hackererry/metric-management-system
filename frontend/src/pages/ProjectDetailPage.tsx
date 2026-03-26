/**
 * 项目详情页面
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Space,
  Descriptions,
  Statistic,
  Typography,
  message,
  Popconfirm,
  Empty,
  Spin,
  Tooltip,
  Progress,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { projectApi, metricApi } from '../services/api';
import { Project, ProjectMetric, ProjectStats, PROJECT_STATUS_CONFIG, Metric } from '../types';
import AddMetricModal from '../components/AddMetricModal';

const { Title, Text } = Typography;

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetric[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [addMetricVisible, setAddMetricVisible] = useState(false);

  // 加载项目详情
  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      const [projectData, metricsData, statsData] = await Promise.all([
        projectApi.getById(Number(id)),
        projectApi.getMetrics(Number(id)),
        projectApi.getStats(Number(id)),
      ]);
      setProject(projectData);
      setProjectMetrics(metricsData);
      setStats(statsData);
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '加载项目详情失败');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  // 渲染达成率仪表盘
  useEffect(() => {
    if (stats && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }

      const chart = echarts.init(chartRef.current);
      chartInstance.current = chart;

      const option = {
        series: [
          {
            type: 'gauge',
            center: ['50%', '70%'],
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            splitNumber: 10,
            axisLine: {
              lineStyle: {
                width: 10,
                color: '#E1DFDD',
              },
            },
            pointer: {
              length: '60%',
              width: 8,
              itemStyle: {
                color: '#0078D4',
              },
            },
            progress: {
              show: true,
              width: 10,
            },
            axisTick: {
              length: 12,
              lineStyle: {
                color: 'auto',
                width: 2,
              },
            },
            splitLine: {
              length: 15,
              lineStyle: {
                color: 'auto',
                width: 3,
              },
            },
            axisLabel: {
              distance: 12,
              color: '#605E5C',
              fontSize: 12,
            },
            title: {
              offsetCenter: [0, '30%'],
              fontSize: 14,
            },
            detail: {
              valueAnimation: true,
              formatter: (value: number) => `${value.toFixed(1)}%`,
              color: '#323130',
              fontSize: 24,
              offsetCenter: [0, '0%'],
            },
            data: [
              {
                value: stats.achievement_rate,
                name: '达成率',
                title: {
                  show: true,
                  text: '整体达成率',
                },
                itemStyle: {
                  color: stats.achievement_rate >= 80 ? '#107C10' :
                    stats.achievement_rate >= 60 ? '#FFB900' : '#D13438',
                },
              },
            ],
          },
        ],
        color: ['#0078D4', '#107C10', '#FFB900', '#D13438'],
      };

      chart.setOption(option);

      const handleResize = () => {
        chart.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    }
  }, [stats]);

  // 移除指标
  const handleRemoveMetric = async (metricId: number) => {
    try {
      await projectApi.removeMetric(Number(id), metricId);
      message.success('移除成功');
      loadProjectData();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '移除失败');
    }
  };

  // 格式化日期
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  // 获取达成状态图标
  const getAchievementIcon = (isAchieved: boolean | null) => {
    if (isAchieved === null) return <MinusCircleOutlined style={{ color: '#605E5C' }} />;
    return isAchieved ?
      <CheckCircleOutlined style={{ color: '#107C10' }} /> :
      <CloseCircleOutlined style={{ color: '#D13438' }} />;
  };

  // 表格列定义
  const columns = [
    {
      title: '指标名称',
      dataIndex: ['metric', 'name'],
      key: 'name',
      width: 180,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '指标编码',
      dataIndex: ['metric', 'code'],
      key: 'code',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: ['metric', 'category'],
      key: 'category',
      width: 100,
    },
    {
      title: '当前值',
      dataIndex: ['metric', 'value'],
      key: 'value',
      width: 100,
      render: (value: number, record: ProjectMetric) => (
        <Text>
          {value}{record.metric?.unit || ''}
        </Text>
      ),
    },
    {
      title: '目标值',
      key: 'target_value',
      width: 100,
      render: (_: unknown, record: ProjectMetric) => {
        const target = record.target_value ?? record.metric?.target_value;
        return target !== null ? (
          <Text>
            {target}{record.metric?.unit || ''}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: '达成状态',
      key: 'is_achieved',
      width: 100,
      render: (_: unknown, record: ProjectMetric) => (
        getAchievementIcon(record.is_achieved)
      ),
    },
    {
      title: '达成率',
      dataIndex: 'achievement_rate',
      key: 'achievement_rate',
      width: 120,
      render: (rate: number) => (
        <Progress
          percent={rate || 0}
          size="small"
          strokeColor={(rate || 0) >= 80 ? '#107C10' : (rate || 0) >= 60 ? '#FFB900' : '#D13438'}
          showInfo={false}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ProjectMetric) => (
        <Popconfirm
          title="确定要移除该指标吗？"
          onConfirm={() => handleRemoveMetric(record.metric_id)}
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (loading) {
    return (
      <Spin />
    );
  }

  if (!project) {
    return <Empty description="项目不存在" />;
  }

  return (
    <div>
      {/* 返回按钮 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/projects')}
        style={{ marginBottom: 16 }}
      >
        返回项目列表
      </Button>

      {/* 项目基本信息卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <Title level={4} style={{ marginBottom: 16 }}>项目信息</Title>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="项目名称">{project.name}</Descriptions.Item>
              <Descriptions.Item label="项目编码">{project.code || '-'}</Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Tag color={PROJECT_STATUS_CONFIG[project.status]?.color}>
                  {PROJECT_STATUS_CONFIG[project.status]?.label || project.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="时间范围">
                {formatDate(project.start_date)} ~ {formatDate(project.end_date)}
              </Descriptions.Item>
              <Descriptions.Item label="描述">{project.description || '暂无描述'}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <div ref={chartRef} style={{ height: 250 }} />
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总指标数"
              value={stats?.total_metrics || 0}
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="达标指标数"
              value={stats?.achieved_metrics || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#107C10' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="整体达成率"
              value={stats?.achievement_rate || 0}
              suffix="%"
              precision={1}
              valueStyle={{
                color: (stats?.achievement_rate || 0) >= 80 ? '#107C10' :
                  (stats?.achievement_rate || 0) >= 60 ? '#FFB900' : '#D13438'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 指标列表卡片 */}
      <Card
        title="关联指标"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddMetricVisible(true)}
          >
            添加指标
          </Button>
        }
      >
        {projectMetrics.length === 0 ? (
          <Empty description="暂无关联指标" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={projectMetrics}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* 添加指标弹窗 */}
      <AddMetricModal
        open={addMetricVisible}
        projectId={Number(id)}
        existingMetricIds={projectMetrics.map((pm) => pm.metric_id)}
        onCancel={() => setAddMetricVisible(false)}
        onSuccess={() => {
          setAddMetricVisible(false);
          loadProjectData();
        }}
      />
    </div>
  );
};

export default ProjectDetailPage;
