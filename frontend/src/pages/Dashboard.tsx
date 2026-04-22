/**
 * 看板页面 - 年度指标 + 产品团队雷达图卡片 + 详细指标列表（按维度分组）
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, message, Divider, Typography, Empty, Select } from 'antd';
import {
  CalendarOutlined,
} from '@ant-design/icons';
import { Category, MetricGroupedResponse, Dimension, DIMENSION_CONFIG, MonthlyHistoryMap } from '../types';
import { metricApi } from '../services/api';
import AnnualMetricsCard from '../components/AnnualMetricsCard';
import SpecialProjectCard from '../components/SpecialProjectCard';
import ProductTeamRadarCard from '../components/ProductTeamRadarCard';
import DimensionMonthlyView from '../components/DimensionMonthlyView';

const { Title, Text } = Typography;
const { Option } = Select;

// 产品团队配置（移除总览）
const TEAM_CONFIG: Record<string, { label: string; color: string }> = {
  product_a: { label: '导购产品团队', color: '#107C10' },
  product_b: { label: '交易产品团队', color: '#FFB900' },
  product_c: { label: '智选车产品团队', color: '#5C2D91' },
  product_d: { label: '公告产品团队', color: '#0078D4' },
};

const Dashboard: React.FC = () => {
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState<number | null>(currentMonth);
  const [allMetrics, setAllMetrics] = useState<Partial<Record<Category, MetricGroupedResponse>>>({});
  const [monthlyHistory, setMonthlyHistory] = useState<Partial<Record<Category, MonthlyHistoryMap>>>({});
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // 加载所有数据
  const loadData = async () => {
    try {
      const categories: Category[] = ['overview', 'product_a', 'product_b', 'product_c', 'product_d'];
      const [groupedResults, historyResults] = await Promise.all([
        Promise.all(categories.map(cat => metricApi.getByCategoryGrouped(cat))),
        Promise.all(categories.map(cat => metricApi.getMonthlyHistory(cat, year))),
      ]);

      const metricsMap = {} as Record<Category, MetricGroupedResponse>;
      const historyMap = {} as Record<Category, MonthlyHistoryMap>;
      categories.forEach((cat, idx) => {
        metricsMap[cat] = groupedResults[idx];
        historyMap[cat] = historyResults[idx];
      });
      setAllMetrics(metricsMap);
      setMonthlyHistory(historyMap);
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    }
  };

  useEffect(() => {
    loadData();
  }, [year]);

  // 计算团队统计数据
  const getTeamStats = (category: Category) => {
    const metrics = allMetrics[category];
    const history = monthlyHistory[category];
    if (!metrics) return { totalCount: 0, normalCount: 0, abnormalCount: 0 };

    const allTeamMetrics = Object.values(metrics).flat();
    const totalCount = allTeamMetrics.length;

    // 从 monthlyHistory 获取当前值来计算统计
    const currentMonth = month || new Date().getMonth() + 1;
    const normalCount = allTeamMetrics.filter(m => {
      const data = history?.[m.code]?.[currentMonth];
      const value = data !== undefined ? (typeof data === 'object' ? data.value : data) : undefined;
      if (value === undefined || value === null) return false;
      if (!m.target_value) return true;
      return m.lower_is_better ? value <= m.target_value : value >= m.target_value;
    }).length;

    const abnormalCount = totalCount - normalCount;

    return { totalCount, normalCount, abnormalCount };
  };

  const selectedMetrics = selectedTeam ? allMetrics[selectedTeam as Category] : null;
  const selectedHistory = selectedTeam ? monthlyHistory[selectedTeam as Category] : null;

  return (
    <div>
      {/* 页面标题和年度筛选 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          指标看板总览
        </Title>
        <div>
          <CalendarOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
          <Select
            value={year}
            onChange={(val) => {
              setYear(val);
              setMonth(null);
            }}
            style={{ width: 100 }}
          >
            <Option value={2023}>2023年</Option>
            <Option value={2024}>2024年</Option>
            <Option value={2025}>2025年</Option>
            <Option value={2026}>2026年</Option>
          </Select>
          <Select
            value={month}
            onChange={setMonth}
            style={{ width: 80, marginLeft: 8 }}
            allowClear
            placeholder="全部"
          >
            <Option value={1}>1月</Option>
            <Option value={2}>2月</Option>
            <Option value={3}>3月</Option>
            <Option value={4}>4月</Option>
            <Option value={5}>5月</Option>
            <Option value={6}>6月</Option>
            <Option value={7}>7月</Option>
            <Option value={8}>8月</Option>
            <Option value={9}>9月</Option>
            <Option value={10}>10月</Option>
            <Option value={11}>11月</Option>
            <Option value={12}>12月</Option>
          </Select>
        </div>
      </div>

      {/* 年度指标展示卡片 */}
      <AnnualMetricsCard
        year={year}
        month={month}
        overviewMetrics={allMetrics.overview}
        overviewHistory={monthlyHistory.overview}
      />

      {/* 专项项目卡片 */}
      <SpecialProjectCard year={year} />

      {/* 产品团队指标区域 - 统一卡片包裹 */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={5} style={{ margin: 0 }}>
              子产品团队指标
            </Title>
            <div style={{ display: 'flex', gap: 8 }}>
              <Select
                value={year}
                onChange={(val) => {
                  setYear(val);
                  setMonth(currentMonth);
                }}
                style={{ width: 100 }}
              >
                <Option value={2023}>2023年</Option>
                <Option value={2024}>2024年</Option>
                <Option value={2025}>2025年</Option>
                <Option value={2026}>2026年</Option>
              </Select>
              <Select
                value={month}
                onChange={setMonth}
                style={{ width: 80 }}
              >
                <Option value={1}>1月</Option>
                <Option value={2}>2月</Option>
                <Option value={3}>3月</Option>
                <Option value={4}>4月</Option>
                <Option value={5}>5月</Option>
                <Option value={6}>6月</Option>
                <Option value={7}>7月</Option>
                <Option value={8}>8月</Option>
                <Option value={9}>9月</Option>
                <Option value={10}>10月</Option>
                <Option value={11}>11月</Option>
                <Option value={12}>12月</Option>
              </Select>
            </div>
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        {/* 产品团队雷达图卡片 */}
        <Row gutter={[16, 16]}>
          {Object.entries(TEAM_CONFIG).map(([key, config]) => {
            const isSelected = selectedTeam === key;

            return (
              <Col xs={24} sm={12} lg={6} key={key}>
                <ProductTeamRadarCard
                  teamKey={key}
                  label={config.label}
                  color={config.color}
                  year={year}
                  month={month}
                  isSelected={isSelected}
                  onClick={() => setSelectedTeam(isSelected ? null : key)}
                  metrics={allMetrics[key as Category] ? Object.values(allMetrics[key as Category] || {}).flat() : []}
                  monthlyData={monthlyHistory[key as Category] || {}}
                />
              </Col>
            );
          })}
        </Row>

        {/* 详细指标列表 - 按维度分组展示 */}
        {selectedTeam && selectedMetrics && (
          <div style={{ marginTop: 24 }}>
            <Divider orientation="left">
              <span style={{ color: TEAM_CONFIG[selectedTeam].color, fontWeight: 600 }}>
                {TEAM_CONFIG[selectedTeam].label} - 详细指标
              </span>
            </Divider>

            {(Object.keys(DIMENSION_CONFIG) as Dimension[]).map(dim => {
              const dimMetrics = selectedMetrics[dim] || [];
              return (
                <DimensionMonthlyView
                  key={dim}
                  dimension={dim}
                  metrics={dimMetrics}
                  monthlyData={selectedHistory || {}}
                  year={year}
                />
              );
            })}
          </div>
        )}

        {/* 未选择提示 */}
        {!selectedTeam && (
          <div style={{ marginTop: 24, textAlign: 'center', color: '#8c8c8c' }}>
            <Text type="secondary">点击上方产品团队卡片查看详细指标</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
