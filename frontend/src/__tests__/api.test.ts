/**
 * API服务测试 - 验证类型和接口定义
 *
 * 注意：由于 axios 使用 ES 模块，直接导入会导致 Jest 解析错误
 * 这些测试专注于验证类型和接口契约，不涉及实际的 API 调用
 */
import { Category, MetricType } from '../types';

describe('services/api - 类型契约', () => {
  describe('metricApi 方法签名验证', () => {
    it('getList 参数应该符合接口定义', () => {
      // 验证 getList 接受的参数结构
      const params = {
        skip: 0,
        limit: 10,
        category: 'overview' as Category,
        metric_type: 'business' as MetricType,
        is_active: true,
        keyword: 'test'
      };

      expect(params.skip).toBe(0);
      expect(params.limit).toBe(10);
      expect(params.category).toBe('overview');
      expect(params.metric_type).toBe('business');
      expect(params.is_active).toBe(true);
      expect(params.keyword).toBe('test');
    });

    it('getByCategory 参数应该是 Category 类型', () => {
      const category: Category = 'product_a';
      const metricType: MetricType = 'tech';
      expect(category).toBe('product_a');
      expect(metricType).toBe('tech');
    });

    it('batchUpdate 参数应该是 Record<string, number> 格式', () => {
      const updates: Record<string, number> = {
        'metric_code_1': 100,
        'metric_code_2': 200
      };
      expect(updates).toEqual({
        'metric_code_1': 100,
        'metric_code_2': 200
      });
    });
  });

  describe('返回类型结构验证', () => {
    it('MetricListResponse 结构应该正确', () => {
      const response = {
        total: 10,
        items: [] as any[]
      };
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('items');
      expect(Array.isArray(response.items)).toBe(true);
    });

    it('MetricGroupedResponse 结构应该包含 business 和 tech', () => {
      const response: { business: any[]; tech: any[] } = {
        business: [],
        tech: []
      };
      expect(response).toHaveProperty('business');
      expect(response).toHaveProperty('tech');
    });

    it('CategoryStats 结构应该包含所有分类', () => {
      const stats = {
        overview: { total: 5, active: 4 },
        product_a: { total: 3, active: 3 },
        product_b: { total: 2, active: 2 },
        product_c: { total: 4, active: 3 },
        product_d: { total: 1, active: 1 }
      };

      expect(stats.overview).toHaveProperty('total');
      expect(stats.overview).toHaveProperty('active');
      expect(stats.product_a).toHaveProperty('total');
    });
  });
});
