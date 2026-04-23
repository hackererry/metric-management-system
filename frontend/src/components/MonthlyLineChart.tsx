/**
 * 月度数据折线图组件 - 展示指标的月度趋势
 */
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Empty } from 'antd';
import { Metric, MonthlyHistoryMap, Dimension } from '../types';

interface MonthlyLineChartProps {
  metrics: Metric[];
  monthlyData: MonthlyHistoryMap;  // { metricCode: { month(1-12): value } }
  year: number;
  dimension?: Dimension;
}

// 预定义颜色数组
const LINE_COLORS = [
  '#0078D4', '#107C10', '#5C2D91', '#008272',
  '#D13438', '#FF8C00', '#004578', '#CA5010'
];

const MonthlyLineChart: React.FC<MonthlyLineChartProps> = ({
  metrics,
  monthlyData,
  year,
  dimension = 'quality',
}) => {
  const option = useMemo(() => {
    if (!metrics || metrics.length === 0 || !monthlyData) {
      return null;
    }

    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const currentMonth = new Date().getMonth();
    const isCurrentYear = year === new Date().getFullYear();

    // 为每个指标创建折线系列
    const series = metrics.map((metric, index) => {
      const monthlyValues = Array.from({ length: 12 }, (_, monthIdx) => {
        // 未来月份不显示数据
        if (isCurrentYear && monthIdx > currentMonth) {
          return null;
        }
        // monthIdx 是 0-based，历史数据中月份是 1-based
        const value = monthlyData[metric.code]?.[monthIdx + 1];
        return value !== undefined ? value : null;
      });

      const color = LINE_COLORS[index % LINE_COLORS.length];

      return {
        name: metric.name,
        type: 'line' as const,
        data: monthlyValues,
        smooth: true,
        lineStyle: { width: 2, color },
        itemStyle: { color },
        symbol: 'circle',
        symbolSize: 6,
        // 如果有达标值，添加参考线
        markLine: metric.target_value ? {
          silent: true,
          symbol: 'none',
          label: {
            formatter: () => `目标: ${metric.target_value}`,
            position: 'insideEndTop',
            fontSize: 10,
            color: '#605E5C',
          },
          lineStyle: {
            type: 'dashed' as const,
            color: color,
            opacity: 0.5,
          },
          data: [{ yAxis: metric.target_value }],
        } : undefined,
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';

          let html = `<div style="font-weight:bold;margin-bottom:8px">${params[0].axisValue}</div>`;
          params.forEach((param) => {
            if (param.value !== null && param.value !== undefined) {
              const metric = metrics.find(m => m.name === param.seriesName);
              const unit = metric?.unit || '';
              const targetValue = metric?.target_value;
              const isMet = targetValue
                ? metric?.lower_is_better
                  ? param.value <= targetValue
                  : param.value >= targetValue
                : true;

              html += `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
                <span style="display:inline-block;width:10px;height:10px;background:${param.color};border-radius:50%"></span>
                <span>${param.seriesName}: </span>
                <span style="color:${isMet ? '#323130' : '#D13438'};font-weight:${isMet ? 'normal' : 600}">${param.value}${unit}</span>
                ${targetValue ? `<span style="color:#605E5C;font-size:11px">(目标: ${targetValue}${unit})</span>` : ''}
              </div>`;
            }
          });
          return html;
        },
      },
      legend: {
        data: metrics.map(m => m.name),
        bottom: 0,
        type: 'scroll' as const,
        itemWidth: 15,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '18%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { fontSize: 11 },
        axisLine: { lineStyle: { color: '#D2D0CE' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 10,
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + 'w';
            }
            return value;
          },
        },
        splitLine: { lineStyle: { color: '#E1DFDD', type: 'dashed' } },
      },
      series,
    };
  }, [metrics, monthlyData, year]);

  if (!metrics || metrics.length === 0 || !monthlyData) {
    return <Empty description="暂无数据" style={{ padding: 20 }} />;
  }

  return (
    <ReactECharts
      option={option!}
      style={{ height: '280px', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default MonthlyLineChart;
