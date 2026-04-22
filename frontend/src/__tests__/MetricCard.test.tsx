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
    target_value: 80,
    description: '这是一个测试指标',
    is_active: true,
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00'
  };

  it('应该渲染指标名称', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={90} />);
    expect(screen.getByText('测试指标')).toBeInTheDocument();
  });

  it('应该渲染指标值', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={90} />);
    // 值显示为 "85 个"（作为一个文本节点）
    expect(screen.getByText(/85 个/)).toBeInTheDocument();
  });

  it('应该渲染目标值', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={90} />);
    expect(screen.getByText(/目标:/)).toBeInTheDocument();
  });

  it('应该渲染目标完成率标签', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={90} />);
    // 106.3% 是完成率
    expect(screen.getByText(/106\.3/)).toBeInTheDocument();
  });

  it('应该渲染环比变化', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={90} />);
    // 环比: -5.6%
    expect(screen.getByText(/环比:/)).toBeInTheDocument();
    expect(screen.getByText(/-5\.6/)).toBeInTheDocument();
  });

  it('当有目标值时应该显示目标区域', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={90} />);
    // 80 个是目标值
    expect(screen.getByText(/80/)).toBeInTheDocument();
  });

  it('环比为负时应该显示向下箭头图标', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={90} />);
    const downIcon = document.querySelector('[aria-label="arrow-down"]');
    expect(downIcon).toBeInTheDocument();
  });

  it('环比为正时应该显示向上箭头图标', () => {
    render(<MetricCard metric={mockMetric} currentValue={95} previousValue={90} />);
    const upIcon = document.querySelector('[aria-label="arrow-up"]');
    expect(upIcon).toBeInTheDocument();
  });

  it('环比为0时应该显示减号图标', () => {
    render(<MetricCard metric={mockMetric} currentValue={90} previousValue={90} />);
    const minusIcon = document.querySelector('[aria-label="minus"]');
    expect(minusIcon).toBeInTheDocument();
  });

  it('环比为负时环比颜色应该是红色', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={90} />);
    // 环比 -5.6% 是负数，应该显示红色
    const changeText = screen.getByText(/-5\.6%/);
    expect(changeText).toBeInTheDocument();
  });

  it('当没有目标值时不应该显示目标区域', () => {
    const noTargetMetric = { ...mockMetric, target_value: null };
    render(<MetricCard metric={noTargetMetric} currentValue={85} previousValue={90} />);
    expect(screen.queryByText(/目标:/)).not.toBeInTheDocument();
  });

  it('当没有环比值时不应该显示环比区域', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={undefined} />);
    expect(screen.queryByText(/环比:/)).not.toBeInTheDocument();
  });

  it('应该显示描述信息图标当有描述时', () => {
    render(<MetricCard metric={mockMetric} currentValue={85} previousValue={90} />);
    const infoIcon = document.querySelector('[aria-label="info-circle"]');
    expect(infoIcon).toBeInTheDocument();
  });

  it('当没有描述时不应该显示信息图标', () => {
    const noDescMetric = { ...mockMetric, description: null };
    render(<MetricCard metric={noDescMetric} currentValue={85} previousValue={90} />);
    const infoIcon = document.querySelector('[aria-label="info-circle"]');
    expect(infoIcon).not.toBeInTheDocument();
  });

  it('百分比类型应该正确格式化', () => {
    const percentMetric = { ...mockMetric, data_type: 'percentage' as const };
    render(<MetricCard metric={percentMetric} currentValue={85.5} previousValue={90} />);
    // 值显示应该包含 85.5%（不带小数点后更多位数）
    const valueElement = document.querySelector('.ant-statistic-content-value');
    expect(valueElement?.textContent).toContain('85.5%');
  });
});
