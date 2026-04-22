/**
 * 指标图表组件 - 使用ECharts展示指标趋势
 */
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Empty } from 'antd';
import { Metric, CATEGORY_CONFIG, MonthlyHistoryMap } from '../types';

interface MetricChartProps {
  metrics: Metric[];
  monthlyData?: MonthlyHistoryMap;
  year?: number;
  title?: string;
  height?: number;
}

const MetricChart: React.FC<MetricChartProps> = ({
  metrics,
  monthlyData = {},
  year = new Date().getFullYear(),
  title = '指标概览',
  height = 300,
}) => {
  const currentMonth = new Date().getMonth() + 1;

  const option = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return null;
    }

    // 准备数据 - 从 monthlyData 获取当前值
    const categories = metrics.map((m) => m.name);
    const values = metrics.map((m) => {
      const data = monthlyData[m.code]?.[currentMonth];
      return data !== undefined ? (typeof data === 'object' ? data.value : data) : null;
    });
    const targets = metrics.map((m) => m.target_value || null);
    const colors = metrics.map((m) => CATEGORY_CONFIG[m.category]?.color || '#1890ff');

    return {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const index = params[0].dataIndex;
          const metric = metrics[index];
          const value = values[index];
          const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
          const prevYear = currentMonth === 1 ? year - 1 : year;
          const prevData = monthlyData[metric.code]?.[prevMonth];
          const prevValue = prevData !== undefined ? (typeof prevData === 'object' ? (prevData as any).value : prevData) : undefined;
          const previousValue = typeof prevValue === 'number' ? prevValue : undefined;
          let html = `<div style="font-weight:bold">${metric.name}</div>`;
          html += `<div>当前值: ${value !== null ? value.toLocaleString() : '-'} ${metric.unit || ''}</div>`;
          if (metric.target_value) {
            html += `<div>目标值: ${metric.target_value.toLocaleString()} ${metric.unit || ''}</div>`;
          }
          if (previousValue !== undefined && previousValue !== 0 && value !== null) {
            const change = (((value - previousValue) / previousValue) * 100).toFixed(1);
            html += `<div>环比: ${Number(change) >= 0 ? '+' : ''}${change}%</div>`;
          }
          return html;
        },
      },
      legend: {
        data: ['当前值', '目标值'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          interval: 0,
          rotate: 30,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + 'w';
            }
            return value;
          },
        },
      },
      series: [
        {
          name: '当前值',
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i] },
          })),
          barMaxWidth: 40,
        },
        {
          name: '目标值',
          type: 'line',
          data: targets,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            type: 'dashed',
            color: '#ff4d4f',
          },
          itemStyle: {
            color: '#ff4d4f',
          },
        },
      ],
    };
  }, [metrics, title]);

  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <ReactECharts
        option={option!}
        style={{ height: `${height}px` }}
        opts={{ renderer: 'svg' }}
      />
    </Card>
  );
};

export default MetricChart;
