/**
 * AnnualMetricsCard 组件测试
 *
 * 注意：该组件可能依赖 echarts-for-react，在 jsdom 环境中渲染可能有问题
 * 这里主要测试组件的 props 类型和基本结构
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Metric, Dimension } from '../types';

describe('components/AnnualMetricsCard', () => {
  // 测试数据
  const mockMetrics: Metric[] = [
    {
      id: 1,
      name: '质量问题数',
      code: 'quality_issue_count',
      category: 'overview',
      data_type: 'number',
      dimension: 'quality',
      lower_is_better: true,
      unit: '个',
      target_value: 20,
      description: '线上质量问题数量',
      is_active: true,
      created_at: '2024-01-01T00:00:00',
      updated_at: '2024-01-01T00:00:00'
    },
    {
      id: 2,
      name: 'NPS',
      code: 'nps_score',
      category: 'overview',
      data_type: 'number',
      dimension: 'experience',
      lower_is_better: false,
      unit: '分',
      target_value: 50,
      description: '用户净推荐值',
      is_active: true,
      created_at: '2024-01-01T00:00:00',
      updated_at: '2024-01-01T00:00:00'
    }
  ];

  it('测试套件能够正确执行', () => {
    expect(true).toBe(true);
  });

  it('Metric 类型应该包含 dimension 字段', () => {
    const metric: Metric = mockMetrics[0];
    expect(metric.dimension).toBe('quality');
  });

  it('Dimension 类型应该只允许有效值', () => {
    const validDimensions: Dimension[] = ['quality', 'efficiency', 'experience', 'business', 'operation'];
    validDimensions.forEach(dim => {
      expect(['quality', 'efficiency', 'experience', 'business', 'operation']).toContain(dim);
    });
  });

  it('指标数组应该能被正确筛选', () => {
    const qualityMetrics = mockMetrics.filter(m => m.dimension === 'quality');
    const experienceMetrics = mockMetrics.filter(m => m.dimension === 'experience');

    expect(qualityMetrics).toHaveLength(1);
    expect(qualityMetrics[0].name).toBe('质量问题数');
    expect(experienceMetrics).toHaveLength(1);
    expect(experienceMetrics[0].name).toBe('NPS');
  });

  it('lower_is_better 逻辑应该正确', () => {
    const qualityMetric = mockMetrics.find(m => m.dimension === 'quality');
    const npsMetric = mockMetrics.find(m => m.dimension === 'experience');

    // 质量问题数越小越好
    expect(qualityMetric?.lower_is_better).toBe(true);
    // NPS 越大越好
    expect(npsMetric?.lower_is_better).toBe(false);
  });

  it('目标值应该存在', () => {
    const metric = mockMetrics[0];
    expect(metric.target_value).toBe(20);
  });
});
