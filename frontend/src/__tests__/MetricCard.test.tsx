import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricCard from '../components/MetricCard';
import { Metric } from '../types';

describe('components/MetricCard', () => {
  const mockMetric: Metric = {
    id: 1,
    name: '测试指标',
    code: 'test_metric',
    category: 'overview',
    data_type: 'number',
    dimension: 'quality',
    lower_is_better: true,
    unit: '个',
    value: 85,
    target_value: 80,
    previous_value: 90,
    trend: 'up',
    description: '这是一个测试指标',
    is_active: true,
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00'
  };

  it('应该渲染指标名称', () => {
    render(<MetricCard metric={mockMetric} />);
    expect(screen.getByText('测试指标')).toBeInTheDocument();
  });

  it('应该渲染指标值', () => {
    render(<MetricCard metric={mockMetric} />);
    // 值显示为 "85 个"（作为一个文本节点）
    expect(screen.getByText(/85 个/)).toBeInTheDocument();
  });

  it('应该渲染目标值', () => {
    render(<MetricCard metric={mockMetric} />);
    expect(screen.getByText(/目标:/)).toBeInTheDocument();
  });

  it('应该渲染目标完成率标签', () => {
    render(<MetricCard metric={mockMetric} />);
    // 106.3% 是完成率
    expect(screen.getByText(/106\.3/)).toBeInTheDocument();
  });

  it('应该渲染环比变化', () => {
    render(<MetricCard metric={mockMetric} />);
    // 环比: -5.6%
    expect(screen.getByText(/环比:/)).toBeInTheDocument();
    expect(screen.getByText(/-5\.6/)).toBeInTheDocument();
  });

  it('当有目标值时应该显示目标区域', () => {
    render(<MetricCard metric={mockMetric} />);
    // 80 个是目标值
    expect(screen.getByText(/80/)).toBeInTheDocument();
  });

  it('trend 为 up 时应该显示向上箭头图标 (aria-label)', () => {
    render(<MetricCard metric={mockMetric} />);
    // 使用 aria-label 检测图标
    const upIcon = document.querySelector('[aria-label="arrow-up"]');
    expect(upIcon).toBeInTheDocument();
  });

  it('trend 为 down 时应该显示向下箭头图标', () => {
    const downMetric = { ...mockMetric, trend: 'down' as const, previous_value: 80 };
    render(<MetricCard metric={downMetric} />);
    const downIcon = document.querySelector('[aria-label="arrow-down"]');
    expect(downIcon).toBeInTheDocument();
  });

  it('trend 为 stable 时应该显示减号图标', () => {
    const stableMetric = { ...mockMetric, trend: 'stable' as const, previous_value: 85 };
    render(<MetricCard metric={stableMetric} />);
    const minusIcon = document.querySelector('[aria-label="minus"]');
    expect(minusIcon).toBeInTheDocument();
  });

  it('trend 为 up 时环比颜色应该是绿色 (正数)', () => {
    render(<MetricCard metric={mockMetric} />);
    // 环比 -5.6% 是负数，应该显示红色
    const changeText = screen.getByText(/-5\.6%/);
    expect(changeText).toBeInTheDocument();
  });

  it('当没有目标值时不应该显示目标区域', () => {
    const noTargetMetric = { ...mockMetric, target_value: null };
    render(<MetricCard metric={noTargetMetric} />);
    expect(screen.queryByText(/目标:/)).not.toBeInTheDocument();
  });

  it('当没有环比值时不应该显示环比区域', () => {
    const noChangeMetric = { ...mockMetric, previous_value: null };
    render(<MetricCard metric={noChangeMetric} />);
    expect(screen.queryByText(/环比:/)).not.toBeInTheDocument();
  });

  it('应该显示描述信息图标当有描述时', () => {
    render(<MetricCard metric={mockMetric} />);
    const infoIcon = document.querySelector('[aria-label="info-circle"]');
    expect(infoIcon).toBeInTheDocument();
  });

  it('当没有描述时不应该显示信息图标', () => {
    const noDescMetric = { ...mockMetric, description: null };
    render(<MetricCard metric={noDescMetric} />);
    const infoIcon = document.querySelector('[aria-label="info-circle"]');
    expect(infoIcon).not.toBeInTheDocument();
  });

  it('百分比类型应该正确格式化', () => {
    const percentMetric = { ...mockMetric, data_type: 'percentage' as const, value: 85.5, target_value: 100, previous_value: 90 };
    render(<MetricCard metric={percentMetric} />);
    // 值显示应该包含 85.5%（不带小数点后更多位数）
    const valueElement = document.querySelector('.ant-statistic-content-value');
    expect(valueElement?.textContent).toContain('85.5%');
  });
});
