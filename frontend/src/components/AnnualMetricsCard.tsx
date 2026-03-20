/**
 * 年度指标展示卡片 - 雷达图 + 环比同比变化 + 月度数据列表
 */
import React from 'react';
import { Card, Row, Col, Table, Typography, Divider, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import { RadarChartOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface AnnualMetricsCardProps {
  year: number;
}

// 获取当前年月
const getCurrentYearMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

// 伪随机数生成器（固定种子，保证相同年份数据一致）
const createRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
};

// 模拟年度数据
const generateYearData = (year: number) => {
  const random = createRandom(year * 10000); // 使用固定种子
  const baseValue = year === 2024 ? 1 : year === 2025 ? 1.1 : 0.9;
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();

  // 判断某月是否有数据（当前年份的已过月份，或历史年份的所有月份）
  const hasDataForMonth = (monthIndex: number) => {
    if (year < currentYear) return true;
    if (year > currentYear) return false;
    return monthIndex < currentMonth;
  };

  // 生成月度数据
  const generateMonthlyData = (generator: (idx: number) => number | string) => {
    return Array.from({ length: 12 }, (_, i) =>
      hasDataForMonth(i) ? generator(i) : null
    );
  };

  // 雷达图数据
  const radarData = {
    quality: Math.min(100, Math.round((75 + random() * 15) * baseValue)),
    efficiency: Math.min(100, Math.round((70 + random() * 15) * baseValue)),
    experience: Math.min(100, Math.round((80 + random() * 10) * baseValue)),
    business: Math.min(100, Math.round((72 + random() * 13) * baseValue)),
    operation: Math.min(100, Math.round((78 + random() * 12) * baseValue)),
  };

  // 获取当前月份的数据索引
  const getCurrentMonthIndex = () => {
    if (year < currentYear) return 11; // 历史年份取12月
    if (year > currentYear) return -1;
    return currentMonth - 1; // 当前年份取当前月-1
  };

  // 质量指标
  const qualityMetrics = [
    {
      name: '质量问题数',
      unit: '个',
      baseline: 20,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => Math.round((15 + random() * 10) * baseValue)),
    },
    {
      name: 'PRD打回次数',
      unit: '次',
      baseline: 10,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => Math.round((8 + random() * 6) * baseValue)),
    },
  ];

  // 效率指标
  const efficiencyMetrics = [
    {
      name: 'PRD提交周期',
      unit: '天',
      baseline: 4,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => +(3 + random() * 2).toFixed(1)),
    },
    {
      name: 'RR的TTM',
      unit: '天',
      baseline: 7,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => +(5 + random() * 3).toFixed(1)),
    },
  ];

  // 体验指标
  const experienceMetrics = [
    {
      name: 'NPS',
      unit: '分',
      baseline: 50,
      lowerIsBetter: false,
      data: generateMonthlyData((i) => +(45 + random() * 20).toFixed(1)),
    },
    {
      name: '首页',
      unit: 'ms',
      baseline: 1000,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => Math.round((800 + random() * 400) * baseValue)),
    },
    {
      name: '分类页',
      unit: 'ms',
      baseline: 800,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => Math.round((600 + random() * 300) * baseValue)),
    },
    {
      name: '频道页',
      unit: 'ms',
      baseline: 900,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => Math.round((700 + random() * 350) * baseValue)),
    },
    {
      name: '搜索页',
      unit: 'ms',
      baseline: 600,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => Math.round((500 + random() * 250) * baseValue)),
    },
    {
      name: '商详页',
      unit: 'ms',
      baseline: 1200,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => Math.round((900 + random() * 450) * baseValue)),
    },
    {
      name: '车商详页',
      unit: 'ms',
      baseline: 1100,
      lowerIsBetter: true,
      data: generateMonthlyData((i) => Math.round((850 + random() * 400) * baseValue)),
    },
  ];

  const currentMonthIdx = getCurrentMonthIndex();
  const lastMonthIdx = currentMonthIdx > 0 ? currentMonthIdx - 1 : 11;
  const lastYearSameMonthIdx = 11; // 去年同月

  // 构建同比环比数据
  const allMetrics = [...qualityMetrics, ...efficiencyMetrics, ...experienceMetrics];
  const changeData = allMetrics.map(m => {
    const currentValue = currentMonthIdx >= 0 && currentMonthIdx < 12 ? m.data[currentMonthIdx] : null;
    const lastMonthValue = currentMonthIdx >= 0 ? m.data[lastMonthIdx] : null;
    const lastYearValue = year > 2023 && currentMonthIdx >= 0 ? m.data[lastYearSameMonthIdx] : null;

    // 环比变化
    let momChange = null;
    if (currentValue !== null && lastMonthValue !== null && typeof currentValue === 'number' && typeof lastMonthValue === 'number') {
      if (lastMonthValue !== 0) {
        momChange = ((currentValue - lastMonthValue) / lastMonthValue * 100).toFixed(1);
      }
    }

    // 同比变化
    let yoyChange = null;
    if (currentValue !== null && lastYearValue !== null && typeof currentValue === 'number' && typeof lastYearValue === 'number') {
      if (lastYearValue !== 0) {
        yoyChange = ((currentValue - lastYearValue) / lastYearValue * 100).toFixed(1);
      }
    }

    return {
      name: m.name,
      unit: m.unit,
      currentValue,
      momChange,
      yoyChange,
      lowerIsBetter: m.lowerIsBetter,
    };
  });

  return { radarData, qualityMetrics, efficiencyMetrics, experienceMetrics, changeData, currentMonthIdx };
};

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const AnnualMetricsCard: React.FC<AnnualMetricsCardProps> = ({ year }) => {
  const yearData = generateYearData(year);

  // 雷达图配置
  const radarOption = {
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: [
        { name: `质量\n${yearData.radarData.quality}分`, max: 100 },
        { name: `效率\n${yearData.radarData.efficiency}分`, max: 100 },
        { name: `体验\n${yearData.radarData.experience}分`, max: 100 },
        { name: `经营\n${yearData.radarData.business}分`, max: 100 },
        { name: `运作\n${yearData.radarData.operation}分`, max: 100 },
      ],
      center: ['50%', '55%'],
      radius: '65%',
      axisName: {
        color: '#333',
        fontSize: 12,
        fontWeight: 500,
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              yearData.radarData.quality,
              yearData.radarData.efficiency,
              yearData.radarData.experience,
              yearData.radarData.business,
              yearData.radarData.operation,
            ],
            name: '综合评分',
            areaStyle: {
              color: 'rgba(24, 144, 255, 0.3)',
            },
            lineStyle: {
              color: '#1890ff',
              width: 2,
            },
            itemStyle: {
              color: '#1890ff',
            },
          },
        ],
      },
    ],
  };

  // 环比同比表格列 - 转置后的版本
  const getChangeColumns = () => {
    // 将指标数据转为列
    return [
      {
        title: '',
        dataIndex: 'type',
        key: 'type',
        width: 80,
        fixed: 'left' as const,
        render: (text: string) => <Text strong>{text}</Text>,
      },
      ...yearData.changeData.map((m, idx) => ({
        title: m.name,
        key: `metric_${idx}`,
        width: 80,
        render: (_: any, record: any) => {
          const value = record.values[idx];
          if (value === null || value === '-') {
            return <Text style={{ color: '#bfbfbf' }}>-</Text>;
          }
          if (typeof value === 'object') {
            // 包含样式的对象
            return value;
          }
          return value;
        },
      })),
    ];
  };

  // 构建转置后的数据
  const getTransposedData = () => {
    const currentMonthLabel = yearData.currentMonthIdx >= 0 ? months[yearData.currentMonthIdx] : '-';

    return [
      {
        type: `当前月(${currentMonthLabel})`,
        values: yearData.changeData.map(m => {
          if (m.currentValue === null) return null;
          return <Text strong>{m.currentValue}{m.unit}</Text>;
        }),
      },
      {
        type: '环比变化',
        values: yearData.changeData.map(m => {
          if (m.momChange === null) return null;
          const value = parseFloat(m.momChange);
          const isPositive = value > 0;
          const isGood = m.lowerIsBetter ? value < 0 : value > 0;
          const color = isGood ? '#52c41a' : '#ff4d4f';
          return (
            <Text style={{ color, fontWeight: value !== 0 ? 600 : 400 }}>
              {isPositive ? '+' : ''}{m.momChange}%
            </Text>
          );
        }),
      },
      {
        type: '同比变化',
        values: yearData.changeData.map(m => {
          if (m.yoyChange === null) return null;
          const value = parseFloat(m.yoyChange);
          const isPositive = value > 0;
          const isGood = m.lowerIsBetter ? value < 0 : value > 0;
          const color = isGood ? '#52c41a' : '#ff4d4f';
          return (
            <Text style={{ color, fontWeight: value !== 0 ? 600 : 400 }}>
              {isPositive ? '+' : ''}{m.yoyChange}%
            </Text>
          );
        }),
      },
    ];
  };

  // 月度数据表格列
  const getMonthColumns = () => {
    return [
      {
        title: '指标名称',
        dataIndex: 'name',
        key: 'name',
        fixed: 'left' as const,
        width: 100,
      },
      {
        title: '基准值',
        key: 'baseline',
        width: 70,
        render: (_: any, record: any) => (
          <Text style={{ fontSize: 11, color: '#1890ff', fontWeight: 500 }}>
            {record.baseline}{record.unit}
          </Text>
        ),
      },
      ...months.map((m, i) => ({
        title: m,
        key: `month_${i}`,
        width: 60,
        render: (_: any, record: any) => {
          const value = record.data[i];
          if (value === null) {
            return <Text style={{ fontSize: 11, color: '#bfbfbf' }}>-</Text>;
          }
          // 判断是否超过基准值（数值越大越差）
          const isExceeded = value > record.baseline;
          return (
            <Text style={{ fontSize: 11, color: isExceeded ? '#ff4d4f' : 'inherit', fontWeight: isExceeded ? 600 : 400 }}>
              {value}{record.unit}
            </Text>
          );
        },
      })),
    ];
  };

  // 渲染指标区块
  const renderMetricSection = (
    title: string,
    color: string,
    metrics: any[]
  ) => (
    <div style={{ marginBottom: 12 }}>
      <Divider orientation="left" style={{ margin: '10px 0' }}>
        <Tag color={color} style={{ fontSize: 12, padding: '1px 6px' }}>{title}</Tag>
      </Divider>
      <Table
        columns={getMonthColumns()}
        dataSource={metrics.map((m, idx) => ({ ...m, key: idx }))}
        pagination={false}
        size="small"
        scroll={{ x: 900 }}
        bordered
      />
    </div>
  );

  return (
    <Card
      title={
        <span>
          <RadarChartOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          {year}年度指标展示
        </span>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={24}>
        {/* 左侧：雷达图 */}
        <Col xs={24} md={6}>
          <ReactECharts
            option={radarOption}
            style={{ height: 280 }}
            opts={{ renderer: 'svg' }}
          />
        </Col>

        {/* 右侧：环比同比变化 */}
        <Col xs={24} md={18}>
          <Table
            columns={getChangeColumns()}
            dataSource={getTransposedData().map((m, idx) => ({ ...m, key: idx }))}
            pagination={false}
            size="small"
            scroll={{ x: 800 }}
            bordered
            title={() => (
              <Text strong style={{ fontSize: 12 }}>
                指标环比/同比变化
                {yearData.currentMonthIdx >= 0 && (
                  <Text type="secondary" style={{ fontWeight: 400, marginLeft: 8 }}>
                    (对比 {year > 2023 ? `${year - 1}年` : ''}{yearData.currentMonthIdx >= 0 ? months[yearData.currentMonthIdx] : ''})
                  </Text>
                )}
              </Text>
            )}
          />
        </Col>
      </Row>

      {/* 下方：月度数据列表 */}
      <div style={{ marginTop: 16 }}>
        {/* 质量指标 */}
        {renderMetricSection('质量指标', 'blue', yearData.qualityMetrics)}

        {/* 效率指标 */}
        {renderMetricSection('效率指标', 'green', yearData.efficiencyMetrics)}

        {/* 体验指标 */}
        {renderMetricSection('体验指标', 'orange', yearData.experienceMetrics)}
      </div>
    </Card>
  );
};

export default AnnualMetricsCard;
