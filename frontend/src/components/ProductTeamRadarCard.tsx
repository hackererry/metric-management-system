/**
 * 产品团队雷达图卡片
 */
import React, { useState, useEffect } from 'react';
import { Card, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';

const { Text } = Typography;

interface ProductTeamRadarCardProps {
  teamKey: string;
  label: string;
  color: string;
  year: number;
  month: number | null;
  isSelected: boolean;
  onClick: () => void;
}

// 获取当前年月
const getCurrentYearMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

// 模拟数据生成
const generateTeamData = (teamKey: string, year: number, month: number | null) => {
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();

  // 如果选择了未来月份，显示暂无数据
  if (year > currentYear || (year === currentYear && month && month > currentMonth)) {
    return {
      radarData: {
        quality: 0,
        efficiency: 0,
        experience: 0,
        business: 0,
        operation: 0,
      },
      noData: true,
    };
  }

  const seed = teamKey.charCodeAt(teamKey.length - 1) + year + (month || 0);
  const random = (base: number) => Math.round(base + (Math.sin(seed) * 10 + Math.random() * 5));

  // 如果选择了特定月份，数据会有月度变化
  const monthFactor = month ? (0.8 + (month * 0.05)) : 1;

  return {
    radarData: {
      quality: random(75 * monthFactor),
      efficiency: random(70 * monthFactor),
      experience: random(80 * monthFactor),
      business: random(72 * monthFactor),
      operation: random(78 * monthFactor),
    },
    noData: false,
  };
};

const ProductTeamRadarCard: React.FC<ProductTeamRadarCardProps> = ({
  teamKey,
  label,
  color,
  year,
  month,
  isSelected,
  onClick,
}) => {
  const [teamData, setTeamData] = useState(generateTeamData(teamKey, year, month));

  useEffect(() => {
    setTeamData(generateTeamData(teamKey, year, month));
  }, [teamKey, year, month]);

  // 雷达图配置
  const radarOption = {
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: [
        { name: `质量\n${teamData.radarData.quality}分`, max: 100 },
        { name: `效率\n${teamData.radarData.efficiency}分`, max: 100 },
        { name: `体验\n${teamData.radarData.experience}分`, max: 100 },
        { name: `经营\n${teamData.radarData.business}分`, max: 100 },
        { name: `运作\n${teamData.radarData.operation}分`, max: 100 },
      ],
      center: ['50%', '55%'],
      radius: '60%',
      axisName: {
        color: '#333',
        fontSize: 11,
        fontWeight: 500,
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              teamData.radarData.quality,
              teamData.radarData.efficiency,
              teamData.radarData.experience,
              teamData.radarData.business,
              teamData.radarData.operation,
            ],
            name: '综合评分',
            areaStyle: {
              color: `${color}40`,
            },
            lineStyle: {
              color: color,
              width: 2,
            },
            itemStyle: {
              color: color,
            },
          },
        ],
      },
    ],
  };

  // 计算综合得分
  const totalScore = Math.round(
    (teamData.radarData.quality +
      teamData.radarData.efficiency +
      teamData.radarData.experience +
      teamData.radarData.business +
      teamData.radarData.operation) / 5
  );

  return (
    <Card
      title={
        <span>
          <span style={{ color, marginRight: 8 }}>●</span>
          {label}
          {month && <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>{year}年{month}月</Text>}
        </span>
      }
      style={{
        height: '100%',
        cursor: 'pointer',
        border: isSelected ? `2px solid ${color}` : '1px solid #f0f0f0',
        boxShadow: isSelected ? `0 2px 8px ${color}40` : 'none',
        transition: 'all 0.3s',
      }}
      styles={{
        body: { padding: 12 }
      }}
      onClick={onClick}
      hoverable
    >
      {/* 雷达图 */}
      {teamData.noData ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text type="secondary">暂无数据</Text>
        </div>
      ) : (
        <ReactECharts
          option={radarOption}
          style={{ height: 180 }}
          opts={{ renderer: 'svg' }}
        />
      )}

      {/* 综合得分 */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        {teamData.noData ? (
          <Text type="secondary">-</Text>
        ) : (
          <>
            <Text type="secondary">综合得分：</Text>
            <Text strong style={{ fontSize: 18, color }}>{totalScore}分</Text>
          </>
        )}
      </div>
    </Card>
  );
};

export default ProductTeamRadarCard;
