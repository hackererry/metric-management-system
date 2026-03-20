"""
数据库配置和模型定义
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# SQLite数据库配置
SQLALCHEMY_DATABASE_URL = "sqlite:///./metrics.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite特有配置
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Metric(Base):
    """指标数据模型"""
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="指标名称")
    code = Column(String(50), unique=True, nullable=False, comment="指标编码")
    category = Column(String(50), nullable=False, comment="所属分类: overview/product_a/product_b/product_c/product_d")
    metric_type = Column(String(20), default="business", comment="指标类型: business/tech (业务指标/研发指标)")
    data_type = Column(String(20), nullable=False, comment="数据类型: number/percentage/trend")
    unit = Column(String(20), comment="单位")
    value = Column(Float, nullable=False, comment="当前值")
    target_value = Column(Float, comment="目标值")
    previous_value = Column(Float, comment="上一周期值")
    trend = Column(String(10), comment="趋势: up/down/stable")
    description = Column(Text, comment="指标描述")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


# 创建数据库表
Base.metadata.create_all(bind=engine)


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_test_data():
    """初始化测试数据"""
    db = SessionLocal()
    try:
        # 检查是否已有数据
        if db.query(Metric).count() == 0:
            test_metrics = [
                # ============ 总览 - 业务指标 ============
                Metric(
                    name="总用户数",
                    code="total_users",
                    category="overview",
                    metric_type="business",
                    data_type="number",
                    unit="人",
                    value=125680,
                    target_value=150000,
                    previous_value=118500,
                    trend="up",
                    description="平台累计注册用户总数"
                ),
                Metric(
                    name="月活跃用户",
                    code="mau",
                    category="overview",
                    metric_type="business",
                    data_type="number",
                    unit="人",
                    value=45230,
                    target_value=50000,
                    previous_value=42100,
                    trend="up",
                    description="近30天内有登录行为的用户数"
                ),
                Metric(
                    name="总收入",
                    code="total_revenue",
                    category="overview",
                    metric_type="business",
                    data_type="number",
                    unit="万元",
                    value=2856.5,
                    target_value=3000.0,
                    previous_value=2650.0,
                    trend="up",
                    description="本月累计收入"
                ),
                Metric(
                    name="转化率",
                    code="conversion_rate",
                    category="overview",
                    metric_type="business",
                    data_type="percentage",
                    unit="%",
                    value=12.8,
                    target_value=15.0,
                    previous_value=11.5,
                    trend="up",
                    description="访客到付费用户的转化率"
                ),

                # ============ 总览 - 研发指标 ============
                Metric(
                    name="API响应时间",
                    code="api_response_time",
                    category="overview",
                    metric_type="tech",
                    data_type="number",
                    unit="ms",
                    value=125,
                    target_value=100,
                    previous_value=138,
                    trend="down",
                    description="API平均响应时间"
                ),
                Metric(
                    name="服务可用性",
                    code="service_availability",
                    category="overview",
                    metric_type="tech",
                    data_type="percentage",
                    unit="%",
                    value=99.95,
                    target_value=99.99,
                    previous_value=99.90,
                    trend="up",
                    description="系统服务可用性"
                ),
                Metric(
                    name="代码覆盖率",
                    code="code_coverage",
                    category="overview",
                    metric_type="tech",
                    data_type="percentage",
                    unit="%",
                    value=85.5,
                    target_value=90.0,
                    previous_value=82.0,
                    trend="up",
                    description="单元测试代码覆盖率"
                ),
                Metric(
                    name="Bug修复率",
                    code="bug_fix_rate",
                    category="overview",
                    metric_type="tech",
                    data_type="percentage",
                    unit="%",
                    value=92.0,
                    target_value=95.0,
                    previous_value=88.0,
                    trend="up",
                    description="本月Bug修复完成率"
                ),

                # ============ 导购产品 - 业务指标 ============
                Metric(
                    name="导购产品日活",
                    code="product_a_dau",
                    category="product_a",
                    metric_type="business",
                    data_type="number",
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
                    metric_type="business",
                    data_type="number",
                    unit="万元",
                    value=856.2,
                    target_value=1000.0,
                    previous_value=780.5,
                    trend="up",
                    description="导购产品本月收入"
                ),
                Metric(
                    name="导购产品满意度",
                    code="product_a_satisfaction",
                    category="product_a",
                    metric_type="business",
                    data_type="percentage",
                    unit="%",
                    value=92.5,
                    target_value=95.0,
                    previous_value=91.0,
                    trend="up",
                    description="导购产品用户满意度评分"
                ),

                # ============ 导购产品 - 研发指标 ============
                Metric(
                    name="导购产品崩溃率",
                    code="product_a_crash_rate",
                    category="product_a",
                    metric_type="tech",
                    data_type="percentage",
                    unit="%",
                    value=0.15,
                    target_value=0.1,
                    previous_value=0.18,
                    trend="down",
                    description="导购产品应用崩溃率"
                ),
                Metric(
                    name="导购产品启动时间",
                    code="product_a_launch_time",
                    category="product_a",
                    metric_type="tech",
                    data_type="number",
                    unit="ms",
                    value=1200,
                    target_value=1000,
                    previous_value=1350,
                    trend="down",
                    description="导购产品应用冷启动时间"
                ),

                # ============ 交易产品 - 业务指标 ============
                Metric(
                    name="交易产品日活",
                    code="product_b_dau",
                    category="product_b",
                    metric_type="business",
                    data_type="number",
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
                    metric_type="business",
                    data_type="number",
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
                    metric_type="business",
                    data_type="percentage",
                    unit="%",
                    value=8.5,
                    target_value=10.0,
                    previous_value=7.8,
                    trend="up",
                    description="交易产品用户付费转化率"
                ),

                # ============ 交易产品 - 研发指标 ============
                Metric(
                    name="交易产品接口成功率",
                    code="product_b_api_success",
                    category="product_b",
                    metric_type="tech",
                    data_type="percentage",
                    unit="%",
                    value=99.2,
                    target_value=99.9,
                    previous_value=98.8,
                    trend="up",
                    description="交易产品接口调用成功率"
                ),
                Metric(
                    name="交易产品平均延迟",
                    code="product_b_latency",
                    category="product_b",
                    metric_type="tech",
                    data_type="number",
                    unit="ms",
                    value=85,
                    target_value=50,
                    previous_value=95,
                    trend="down",
                    description="交易产品接口平均延迟"
                ),

                # ============ 智选车产品 - 业务指标 ============
                Metric(
                    name="智选车产品日活",
                    code="product_c_dau",
                    category="product_c",
                    metric_type="business",
                    data_type="number",
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
                    metric_type="business",
                    data_type="number",
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
                    metric_type="business",
                    data_type="number",
                    unit="单",
                    value=25680,
                    target_value=30000,
                    previous_value=23500,
                    trend="up",
                    description="智选车产品本月订单量"
                ),

                # ============ 智选车产品 - 研发指标 ============
                Metric(
                    name="智选车产品错误率",
                    code="product_c_error_rate",
                    category="product_c",
                    metric_type="tech",
                    data_type="percentage",
                    unit="%",
                    value=0.5,
                    target_value=0.3,
                    previous_value=0.8,
                    trend="down",
                    description="智选车产品系统错误率"
                ),
                Metric(
                    name="智选车产品部署频率",
                    code="product_c_deploy_freq",
                    category="product_c",
                    metric_type="tech",
                    data_type="number",
                    unit="次/周",
                    value=12,
                    target_value=15,
                    previous_value=10,
                    trend="up",
                    description="智选车产品每周部署次数"
                ),

                # ============ 公告产品 - 业务指标 ============
                Metric(
                    name="公告产品日活",
                    code="product_d_dau",
                    category="product_d",
                    metric_type="business",
                    data_type="number",
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
                    metric_type="business",
                    data_type="number",
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
                    metric_type="business",
                    data_type="number",
                    unit="单",
                    value=15680,
                    target_value=18000,
                    previous_value=14200,
                    trend="up",
                    description="公告产品本月订单量"
                ),

                # ============ 公告产品 - 研发指标 ============
                Metric(
                    name="公告产品响应时间",
                    code="product_d_latency",
                    category="product_d",
                    metric_type="tech",
                    data_type="number",
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
                    metric_type="tech",
                    data_type="percentage",
                    unit="%",
                    value=0.45,
                    target_value=0.3,
                    previous_value=0.52,
                    trend="up",
                    description="公告产品系统错误率"
                ),
                Metric(
                    name="公告产品部署频率",
                    code="product_d_deploy_freq",
                    category="product_d",
                    metric_type="tech",
                    data_type="number",
                    unit="次/周",
                    value=8,
                    target_value=10,
                    previous_value=7,
                    trend="up",
                    description="公告产品每周部署次数"
                ),
            ]

            db.add_all(test_metrics)
            db.commit()
            print("[OK] 测试数据初始化完成")
    except Exception as e:
        print(f"[ERROR] 初始化测试数据失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_test_data()
