import {
  Metric,
  MetricFormData,
  MetricListResponse,
  MetricGroupedResponse,
  CategoryStats,
  Category,
  MetricType,
  DataType,
  Trend,
  Dimension,
  CATEGORY_CONFIG,
  DATA_TYPE_CONFIG,
  TREND_CONFIG,
  METRIC_TYPE_CONFIG,
  DIMENSION_CONFIG
} from '../types';

describe('types/index', () => {
  describe('类型定义', () => {
    it('Metric 类型应该包含所有必要字段', () => {
      const metric: Metric = {
        id: 1,
        name: '测试指标',
        code: 'test_metric',
        category: 'overview',
        metric_type: 'business',
        data_type: 'number',
        dimension: 'quality',
        lower_is_better: true,
        unit: '个',
        value: 100,
        target_value: 80,
        challenge_value: 60,
        previous_value: 90,
        trend: 'up',
        description: '描述',
        is_active: true,
        created_at: '2024-01-01T00:00:00',
        updated_at: '2024-01-01T00:00:00'
      };

      expect(metric.id).toBe(1);
      expect(metric.name).toBe('测试指标');
      expect(metric.category).toBe('overview');
    });

    it('MetricFormData 应该包含创建指标所需字段', () => {
      const formData: MetricFormData = {
        name: '表单指标',
        code: 'form_metric',
        category: 'product_a',
        metric_type: 'tech',
        data_type: 'percentage',
        dimension: 'efficiency',
        lower_is_better: false,
        unit: '%',
        value: 95.5,
        target_value: 90,
        challenge_value: 98,
        description: '表单描述'
      };

      expect(formData.name).toBe('表单指标');
      expect(formData.code).toBe('form_metric');
    });

    it('MetricListResponse 类型应该正确', () => {
      const response: MetricListResponse = {
        total: 10,
        items: []
      };

      expect(response.total).toBe(10);
      expect(response.items).toEqual([]);
    });

    it('MetricGroupedResponse 类型应该正确', () => {
      const response: MetricGroupedResponse = {
        business: [],
        tech: []
      };

      expect(response.business).toEqual([]);
      expect(response.tech).toEqual([]);
    });

    it('CategoryStats 类型应该包含所有分类', () => {
      const stats: CategoryStats = {
        overview: { total: 5, active: 4 },
        product_a: { total: 3, active: 3 },
        product_b: { total: 2, active: 2 },
        product_c: { total: 4, active: 3 },
        product_d: { total: 1, active: 1 }
      };

      expect(stats.overview.total).toBe(5);
      expect(stats.product_a.active).toBe(3);
    });
  });

  describe('类型别名', () => {
    it('Category 应该只允许有效值', () => {
      const categories: Category[] = ['overview', 'product_a', 'product_b', 'product_c', 'product_d'];
      categories.forEach(cat => {
        expect(['overview', 'product_a', 'product_b', 'product_c', 'product_d']).toContain(cat);
      });
    });

    it('MetricType 应该只允许 business 或 tech', () => {
      const types: MetricType[] = ['business', 'tech'];
      types.forEach(type => {
        expect(['business', 'tech']).toContain(type);
      });
    });

    it('DataType 应该只允许有效值', () => {
      const types: DataType[] = ['number', 'percentage', 'trend'];
      types.forEach(type => {
        expect(['number', 'percentage', 'trend']).toContain(type);
      });
    });

    it('Trend 应该只允许有效值', () => {
      const trends: Trend[] = ['up', 'down', 'stable'];
      trends.forEach(trend => {
        expect(['up', 'down', 'stable']).toContain(trend);
      });
    });

    it('Dimension 应该只允许有效值', () => {
      const dimensions: Dimension[] = ['quality', 'efficiency', 'experience', 'business'];
      dimensions.forEach(dim => {
        expect(['quality', 'efficiency', 'experience', 'business']).toContain(dim);
      });
    });
  });

  describe('配置对象', () => {
    it('CATEGORY_CONFIG 应该包含所有分类', () => {
      expect(Object.keys(CATEGORY_CONFIG)).toEqual([
        'overview', 'product_a', 'product_b', 'product_c', 'product_d'
      ]);
    });

    it('CATEGORY_CONFIG 每个配置应该包含 label 和 color', () => {
      Object.values(CATEGORY_CONFIG).forEach(config => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
      });
    });

    it('DATA_TYPE_CONFIG 应该包含所有数据类型', () => {
      expect(Object.keys(DATA_TYPE_CONFIG)).toEqual(['number', 'percentage', 'trend']);
    });

    it('TREND_CONFIG 每个配置应该包含 label, color 和 icon', () => {
      Object.values(TREND_CONFIG).forEach(config => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('icon');
      });
    });

    it('METRIC_TYPE_CONFIG 应该包含 business 和 tech', () => {
      expect(Object.keys(METRIC_TYPE_CONFIG)).toEqual(['business', 'tech']);
    });

    it('DIMENSION_CONFIG 应该包含所有维度', () => {
      expect(Object.keys(DIMENSION_CONFIG)).toEqual(['quality', 'efficiency', 'experience', 'business']);
    });
  });
});
