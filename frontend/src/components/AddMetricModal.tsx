/**
 * 添加指标弹窗组件
 */
import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, Button, Space, message, Empty, Spin } from 'antd';
import { metricApi, projectApi } from '../services/api';
import { Metric } from '../types';

interface AddMetricModalProps {
  open: boolean;
  projectId: number;
  onCancel: () => void;
  onSuccess: () => void;
  existingMetricIds?: number[];
}

const AddMetricModal: React.FC<AddMetricModalProps> = ({
  open,
  projectId,
  onCancel,
  onSuccess,
  existingMetricIds = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [targetValues, setTargetValues] = useState<Record<number, number | undefined>>({});
  const [keyword, setKeyword] = useState('');

  // 加载指标列表
  useEffect(() => {
    if (open) {
      loadMetrics();
    }
  }, [open]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await metricApi.getList({ limit: 200 });
      // 过滤已添加的指标
      const availableMetrics = response.items.filter(
        (m) => !existingMetricIds.includes(m.id)
      );
      setMetrics(availableMetrics);
    } catch (error) {
      message.error('加载指标失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索过滤
  const filteredMetrics = metrics.filter((m) => {
    if (!keyword) return true;
    return (
      m.name.toLowerCase().includes(keyword.toLowerCase()) ||
      m.code.toLowerCase().includes(keyword.toLowerCase())
    );
  });

  // 处理提交
  const handleSubmit = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要添加的指标');
      return;
    }

    setLoading(true);
    try {
      // 逐个添加指标
      for (const metricId of selectedRowKeys) {
        const targetValue = targetValues[metricId as number];
        await projectApi.addMetric(projectId, {
          metric_id: metricId as number,
          target_value: targetValue,
        });
      }
      message.success(`成功添加 ${selectedRowKeys.length} 个指标`);
      onSuccess();
      // 重置状态
      setSelectedRowKeys([]);
      setTargetValues({});
      setKeyword('');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '添加指标失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '指标编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (value: number, record: Metric) => `${value}${record.unit || ''}`,
    },
    {
      title: '默认目标值',
      dataIndex: 'target_value',
      key: 'target_value',
      width: 100,
      render: (value: number, record: Metric) => value ? `${value}${record.unit || ''}` : '-',
    },
    {
      title: '自定义目标值',
      key: 'custom_target',
      width: 120,
      render: (_: unknown, record: Metric) => (
        <Input
          type="number"
          placeholder="可选"
          size="small"
          value={targetValues[record.id]}
          onChange={(e) => {
            const value = e.target.value ? parseFloat(e.target.value) : undefined;
            setTargetValues((prev) => ({ ...prev, [record.id]: value }));
          }}
        />
      ),
    },
  ];

  return (
    <Modal
      title="添加指标到项目"
      open={open}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          disabled={selectedRowKeys.length === 0}
        >
          添加选中指标 ({selectedRowKeys.length})
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Input.Search
          placeholder="搜索指标名称或编码"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 300 }}
        />

        {loading ? (
          <Spin />
        ) : filteredMetrics.length === 0 ? (
          <Empty description="暂无可添加的指标" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredMetrics}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            pagination={{ pageSize: 10 }}
            size="small"
            scroll={{ y: 400 }}
          />
        )}
      </Space>
    </Modal>
  );
};

export default AddMetricModal;
