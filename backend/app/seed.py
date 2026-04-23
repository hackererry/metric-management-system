"""
数据库种子数据 - 初始化测试数据
"""
import random
from datetime import datetime

from app.database import SessionLocal
from app.models import Metric, MetricHistory


def init_test_data():
    """初始化测试数据（仅在数据库为空时执行）"""
    db = SessionLocal()
    try:
        # 检查是否已有数据
        if db.query(Metric).count() == 0:
            test_metrics = [
                # ============ 总览 - 年度指标（按维度分类）============

                # 质量维度 - 越小越好
                Metric(
                    name="质量问题数",
                    code="quality_issue_count",
                    category="overview",
                    data_type="number",
                    dimension="quality",
                    lower_is_better=True,
                    unit="个",
                    target_value=20,
                    description="线上质量问题数量"
                ),
                Metric(
                    name="事故和事件数",
                    code="incident_count",
                    category="overview",
                    data_type="number",
                    dimension="quality",
                    lower_is_better=True,
                    unit="个",
                    target_value=5,
                    description="线上事故和事件数量"
                ),

                # 效率维度 - 越小越好
                Metric(
                    name="SR的TTM",
                    code="sr_ttm",
                    category="overview",
                    data_type="number",
                    dimension="efficiency",
                    lower_is_better=True,
                    unit="天",
                    target_value=4,
                    description="需求到上线的平均周期"
                ),
                Metric(
                    name="RR的TTM",
                    code="rr_ttm",
                    category="overview",
                    data_type="number",
                    dimension="efficiency",
                    lower_is_better=True,
                    unit="天",
                    target_value=7,
                    description="需求到上线的平均周期"
                ),

                # 体验维度
                Metric(
                    name="NPS",
                    code="nps_score",
                    category="overview",
                    data_type="number",
                    dimension="experience",
                    lower_is_better=False,
                    unit="分",
                    target_value=50,
                    description="用户净推荐值"
                ),
                Metric(
                    name="首页加载时长",
                    code="homepage_load_time",
                    category="overview",
                    data_type="number",
                    dimension="experience",
                    lower_is_better=True,
                    unit="ms",
                    target_value=1000,
                    description="首页平均加载时长"
                ),
                Metric(
                    name="分类页加载时长",
                    code="category_load_time",
                    category="overview",
                    data_type="number",
                    dimension="experience",
                    lower_is_better=True,
                    unit="ms",
                    target_value=800,
                    description="分类页平均加载时长"
                ),
                Metric(
                    name="频道页加载时长",
                    code="channel_load_time",
                    category="overview",
                    data_type="number",
                    dimension="experience",
                    lower_is_better=True,
                    unit="ms",
                    target_value=900,
                    description="频道页平均加载时长"
                ),
                Metric(
                    name="白屏个数",
                    code="white_screen_count",
                    category="overview",
                    data_type="number",
                    dimension="experience",
                    lower_is_better=True,
                    unit="个",
                    target_value=2,
                    description="页面白屏次数"
                ),

                # 经营维度 - 越大越好
                Metric(
                    name="搜索召回率",
                    code="search_recall",
                    category="overview",
                    data_type="percentage",
                    dimension="business",
                    lower_is_better=False,
                    unit="%",
                    target_value=90.0,
                    description="搜索结果召回率"
                ),
                Metric(
                    name="推荐人均曝光点击率",
                    code="recommend_ctr",
                    category="overview",
                    data_type="percentage",
                    dimension="business",
                    lower_is_better=False,
                    unit="%",
                    target_value=15.0,
                    description="推荐位人均曝光点击率"
                ),
                Metric(
                    name="商详到达率",
                    code="product_detail_rate",
                    category="overview",
                    data_type="percentage",
                    dimension="business",
                    lower_is_better=False,
                    unit="%",
                    target_value=70.0,
                    description="商品详情页到达率"
                ),

                # ============ 导购产品 (product_a) ============

                # 经营维度
                Metric(
                    name="导购产品日活",
                    code="product_a_dau",
                    category="product_a",
                    data_type="number",
                    dimension="business",
                    unit="人",
                    target_value=15000,
                    description="导购产品每日活跃用户数"
                ),
                Metric(
                    name="导购产品收入",
                    code="product_a_revenue",
                    category="product_a",
                    data_type="number",
                    dimension="business",
                    unit="万元",
                    target_value=1000.0,
                    description="导购产品本月收入"
                ),

                # 体验维度
                Metric(
                    name="导购产品满意度",
                    code="product_a_satisfaction",
                    category="product_a",
                    data_type="percentage",
                    dimension="experience",
                    unit="%",
                    target_value=95.0,
                    description="导购产品用户满意度评分"
                ),

                # 质量维度
                Metric(
                    name="导购产品崩溃率",
                    code="product_a_crash_rate",
                    category="product_a",
                    data_type="percentage",
                    dimension="quality",
                    lower_is_better=True,
                    unit="%",
                    target_value=0.1,
                    description="导购产品应用崩溃率"
                ),

                # 效率维度
                Metric(
                    name="导购产品启动时间",
                    code="product_a_launch_time",
                    category="product_a",
                    data_type="number",
                    dimension="efficiency",
                    lower_is_better=True,
                    unit="ms",
                    target_value=1000,
                    description="导购产品应用冷启动时间"
                ),

                # 运作维度
                Metric(
                    name="导购产品需求交付周期",
                    code="product_a_delivery_cycle",
                    category="product_a",
                    data_type="number",
                    dimension="operation",
                    lower_is_better=True,
                    unit="天",
                    target_value=7,
                    description="需求从提出到上线的平均周期"
                ),

                # ============ 交易产品 (product_b) ============

                # 经营维度
                Metric(
                    name="交易产品日活",
                    code="product_b_dau",
                    category="product_b",
                    data_type="number",
                    dimension="business",
                    unit="人",
                    target_value=10000,
                    description="交易产品每日活跃用户数"
                ),
                Metric(
                    name="交易产品收入",
                    code="product_b_revenue",
                    category="product_b",
                    data_type="number",
                    dimension="business",
                    unit="万元",
                    target_value=700.0,
                    description="交易产品本月收入"
                ),
                Metric(
                    name="交易产品付费率",
                    code="product_b_payment_rate",
                    category="product_b",
                    data_type="percentage",
                    dimension="business",
                    unit="%",
                    target_value=10.0,
                    description="交易产品用户付费转化率"
                ),

                # 质量维度
                Metric(
                    name="交易产品接口成功率",
                    code="product_b_api_success",
                    category="product_b",
                    data_type="percentage",
                    dimension="quality",
                    lower_is_better=False,
                    unit="%",
                    target_value=99.9,
                    description="交易产品接口调用成功率"
                ),

                # 效率维度
                Metric(
                    name="交易产品平均延迟",
                    code="product_b_latency",
                    category="product_b",
                    data_type="number",
                    dimension="efficiency",
                    lower_is_better=True,
                    unit="ms",
                    target_value=50,
                    description="交易产品接口平均延迟"
                ),

                # 运作维度
                Metric(
                    name="交易产品需求交付周期",
                    code="product_b_delivery_cycle",
                    category="product_b",
                    data_type="number",
                    dimension="operation",
                    lower_is_better=True,
                    unit="天",
                    target_value=8,
                    description="需求从提出到上线的平均周期"
                ),

                # ============ 智选车产品 (product_c) ============

                # 经营维度
                Metric(
                    name="智选车产品日活",
                    code="product_c_dau",
                    category="product_c",
                    data_type="number",
                    dimension="business",
                    unit="人",
                    target_value=18000,
                    description="智选车产品每日活跃用户数"
                ),
                Metric(
                    name="智选车产品收入",
                    code="product_c_revenue",
                    category="product_c",
                    data_type="number",
                    dimension="business",
                    unit="万元",
                    target_value=1400.0,
                    description="智选车产品本月收入"
                ),
                Metric(
                    name="智选车产品订单量",
                    code="product_c_orders",
                    category="product_c",
                    data_type="number",
                    dimension="business",
                    unit="单",
                    target_value=30000,
                    description="智选车产品本月订单量"
                ),

                # 质量维度
                Metric(
                    name="智选车产品错误率",
                    code="product_c_error_rate",
                    category="product_c",
                    data_type="percentage",
                    dimension="quality",
                    lower_is_better=True,
                    unit="%",
                    target_value=0.3,
                    description="智选车产品系统错误率"
                ),

                # 效率维度
                Metric(
                    name="智选车产品部署频率",
                    code="product_c_deploy_freq",
                    category="product_c",
                    data_type="number",
                    dimension="efficiency",
                    unit="次/周",
                    target_value=15,
                    description="智选车产品每周部署次数"
                ),

                # 运作维度
                Metric(
                    name="智选车产品需求交付周期",
                    code="product_c_delivery_cycle",
                    category="product_c",
                    data_type="number",
                    dimension="operation",
                    lower_is_better=True,
                    unit="天",
                    target_value=10,
                    description="需求从提出到上线的平均周期"
                ),

                # ============ 公告产品 (product_d) ============

                # 经营维度
                Metric(
                    name="公告产品日活",
                    code="product_d_dau",
                    category="product_d",
                    data_type="number",
                    dimension="business",
                    unit="人",
                    target_value=10000,
                    description="公告产品每日活跃用户数"
                ),
                Metric(
                    name="公告产品收入",
                    code="product_d_revenue",
                    category="product_d",
                    data_type="number",
                    dimension="business",
                    unit="万元",
                    target_value=800.0,
                    description="公告产品本月收入"
                ),
                Metric(
                    name="公告产品订单量",
                    code="product_d_orders",
                    category="product_d",
                    data_type="number",
                    dimension="business",
                    unit="单",
                    target_value=18000,
                    description="公告产品本月订单量"
                ),

                # 质量维度
                Metric(
                    name="公告产品响应时间",
                    code="product_d_latency",
                    category="product_d",
                    data_type="number",
                    dimension="quality",
                    lower_is_better=True,
                    unit="ms",
                    target_value=100,
                    description="公告产品平均接口响应时间"
                ),
                Metric(
                    name="公告产品错误率",
                    code="product_d_error_rate",
                    category="product_d",
                    data_type="percentage",
                    dimension="quality",
                    lower_is_better=True,
                    unit="%",
                    target_value=0.3,
                    description="公告产品系统错误率"
                ),

                # 效率维度
                Metric(
                    name="公告产品部署频率",
                    code="product_d_deploy_freq",
                    category="product_d",
                    data_type="number",
                    dimension="efficiency",
                    unit="次/周",
                    target_value=10,
                    description="公告产品每周部署次数"
                ),

                # 运作维度
                Metric(
                    name="公告产品需求交付周期",
                    code="product_d_delivery_cycle",
                    category="product_d",
                    data_type="number",
                    dimension="operation",
                    lower_is_better=True,
                    unit="天",
                    target_value=8,
                    description="需求从提出到上线的平均周期"
                ),
            ]

            db.add_all(test_metrics)
            db.commit()

            # 生成月度历史种子数据
            _seed_monthly_history(db, test_metrics)

            print("[OK] 测试数据初始化完成")
    except Exception as e:
        print(f"[ERROR] 初始化测试数据失败: {e}")
        db.rollback()
    finally:
        db.close()


def _seed_monthly_history(db, metrics):
    """为所有指标生成月度历史数据"""
    current_year = datetime.now().year
    current_month = datetime.now().month

    # 使用固定种子保证数据可重复
    rng = random.Random(42)

    # 基于 target_value 生成历史数据
    history_records = []
    for metric in metrics:
        for month in range(1, current_month + 1):
            # 基于达标值生成有趋势的月度数据
            # 越早的月份越远离达标值（模拟改善趋势）
            months_back = current_month - month
            if metric.lower_is_better:
                # 越小越好：早期值更大
                factor = 1 + months_back * 0.03
            else:
                # 越大越好：早期值更小
                factor = 1 - months_back * 0.02

            base_value = metric.target_value * factor
            # 添加小幅度随机波动
            noise = rng.uniform(-0.05, 0.05) * abs(metric.target_value) if metric.target_value != 0 else 0
            month_value = round(base_value + noise, 2)

            history_records.append(MetricHistory(
                metric_id=metric.id,
                year=current_year,
                month=month,
                value=month_value
            ))

    if history_records:
        db.add_all(history_records)
        db.commit()
