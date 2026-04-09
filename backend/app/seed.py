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
                    value=18,
                    target_value=20,
                    previous_value=22,
                    trend="down",
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
                    value=3,
                    target_value=5,
                    previous_value=4,
                    trend="down",
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
                    value=3.5,
                    target_value=4,
                    previous_value=4.2,
                    trend="down",
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
                    value=6.2,
                    target_value=7,
                    previous_value=7.5,
                    trend="down",
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
                    value=52,
                    target_value=50,
                    previous_value=48,
                    trend="up",
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
                    value=920,
                    target_value=1000,
                    previous_value=1050,
                    trend="down",
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
                    value=720,
                    target_value=800,
                    previous_value=850,
                    trend="down",
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
                    value=820,
                    target_value=900,
                    previous_value=880,
                    trend="down",
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
                    value=1,
                    target_value=2,
                    previous_value=3,
                    trend="down",
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
                    value=85.2,
                    target_value=90.0,
                    previous_value=82.5,
                    trend="up",
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
                    value=12.8,
                    target_value=15.0,
                    previous_value=11.5,
                    trend="up",
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
                    value=68.5,
                    target_value=70.0,
                    previous_value=65.2,
                    trend="up",
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
                    value=12500,
                    target_value=15000,
                    previous_value=11200,
                    trend="up",
                    description="导购产品每日活跃用户数"
                ),
                Metric(
                    name="导购产品收入",
                    code="product_a_revenue",
                    category="product_a",
                    data_type="number",
                    dimension="business",
                    unit="万元",
                    value=856.2,
                    target_value=1000.0,
                    previous_value=780.5,
                    trend="up",
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
                    value=92.5,
                    target_value=95.0,
                    previous_value=91.0,
                    trend="up",
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
                    value=0.15,
                    target_value=0.1,
                    previous_value=0.18,
                    trend="down",
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
                    value=1200,
                    target_value=1000,
                    previous_value=1350,
                    trend="down",
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
                    value=8.5,
                    target_value=7,
                    previous_value=9.2,
                    trend="down",
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
                    value=8600,
                    target_value=10000,
                    previous_value=8200,
                    trend="up",
                    description="交易产品每日活跃用户数"
                ),
                Metric(
                    name="交易产品收入",
                    code="product_b_revenue",
                    category="product_b",
                    data_type="number",
                    dimension="business",
                    unit="万元",
                    value=625.8,
                    target_value=700.0,
                    previous_value=590.0,
                    trend="up",
                    description="交易产品本月收入"
                ),
                Metric(
                    name="交易产品付费率",
                    code="product_b_payment_rate",
                    category="product_b",
                    data_type="percentage",
                    dimension="business",
                    unit="%",
                    value=8.5,
                    target_value=10.0,
                    previous_value=7.8,
                    trend="up",
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
                    value=99.2,
                    target_value=99.9,
                    previous_value=98.8,
                    trend="up",
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
                    value=85,
                    target_value=50,
                    previous_value=95,
                    trend="down",
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
                    value=10.2,
                    target_value=8,
                    previous_value=11.5,
                    trend="down",
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
                    value=15000,
                    target_value=18000,
                    previous_value=14200,
                    trend="up",
                    description="智选车产品每日活跃用户数"
                ),
                Metric(
                    name="智选车产品收入",
                    code="product_c_revenue",
                    category="product_c",
                    data_type="number",
                    dimension="business",
                    unit="万元",
                    value=1250.3,
                    target_value=1400.0,
                    previous_value=1180.0,
                    trend="up",
                    description="智选车产品本月收入"
                ),
                Metric(
                    name="智选车产品订单量",
                    code="product_c_orders",
                    category="product_c",
                    data_type="number",
                    dimension="business",
                    unit="单",
                    value=25680,
                    target_value=30000,
                    previous_value=23500,
                    trend="up",
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
                    value=0.5,
                    target_value=0.3,
                    previous_value=0.8,
                    trend="down",
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
                    value=12,
                    target_value=15,
                    previous_value=10,
                    trend="up",
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
                    value=12.5,
                    target_value=10,
                    previous_value=14.0,
                    trend="down",
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
                    value=8500,
                    target_value=10000,
                    previous_value=7800,
                    trend="up",
                    description="公告产品每日活跃用户数"
                ),
                Metric(
                    name="公告产品收入",
                    code="product_d_revenue",
                    category="product_d",
                    data_type="number",
                    dimension="business",
                    unit="万元",
                    value=680.5,
                    target_value=800.0,
                    previous_value=620.0,
                    trend="up",
                    description="公告产品本月收入"
                ),
                Metric(
                    name="公告产品订单量",
                    code="product_d_orders",
                    category="product_d",
                    data_type="number",
                    dimension="business",
                    unit="单",
                    value=15680,
                    target_value=18000,
                    previous_value=14200,
                    trend="up",
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
                    value=125,
                    target_value=100,
                    previous_value=135,
                    trend="up",
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
                    value=0.45,
                    target_value=0.3,
                    previous_value=0.52,
                    trend="up",
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
                    value=8,
                    target_value=10,
                    previous_value=7,
                    trend="up",
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
                    value=9.8,
                    target_value=8,
                    previous_value=11.0,
                    trend="down",
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

    history_records = []
    for metric in metrics:
        for month in range(1, current_month + 1):
            # 基于当前值生成有趋势的月度数据
            # 越早的月份越远离当前值（模拟改善趋势）
            months_back = current_month - month
            if metric.lower_is_better:
                # 越小越好：早期值更大
                factor = 1 + months_back * 0.03
            else:
                # 越大越好：早期值更小
                factor = 1 - months_back * 0.02

            base_value = metric.value * factor
            # 添加小幅度随机波动
            noise = rng.uniform(-0.05, 0.05) * abs(metric.value) if metric.value != 0 else 0
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
