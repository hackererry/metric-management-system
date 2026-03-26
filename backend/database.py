"""
数据库配置和模型定义
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# SQLite数据库配置
SQLALCHEMY_DATABASE_URL = "sqlite:///./metrics_final.db"

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
    dimension = Column(String(20), nullable=True, comment="维度: quality/efficiency/experience/business (用于年度指标分类)")
    lower_is_better = Column(Boolean, default=True, comment="达标条件: True表示越小越好, False表示越大越好")
    unit = Column(String(20), comment="单位")
    value = Column(Float, nullable=False, comment="当前值")
    target_value = Column(Float, comment="目标值")
    challenge_value = Column(Float, nullable=True, comment="挑战值")
    previous_value = Column(Float, comment="上一周期值")
    trend = Column(String(10), comment="趋势: up/down/stable")
    description = Column(Text, comment="指标描述")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class Project(Base):
    """项目专题模型"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="项目名称")
    code = Column(String(50), unique=True, nullable=True, comment="项目编码")
    description = Column(Text, nullable=True, comment="项目描述")
    status = Column(String(20), default="active", comment="状态: active/completed/archived")
    start_date = Column(DateTime, nullable=True, comment="开始日期")
    end_date = Column(DateTime, nullable=True, comment="结束日期")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    # 关联项目指标
    project_metrics = relationship("ProjectMetric", back_populates="project", cascade="all, delete-orphan")


class ProjectMetric(Base):
    """项目-指标关联模型"""
    __tablename__ = "project_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, comment="项目ID")
    metric_id = Column(Integer, ForeignKey("metrics.id", ondelete="CASCADE"), nullable=False, comment="指标ID")
    target_value = Column(Float, nullable=True, comment="该项目下的目标值（可覆盖原指标目标值）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    # 唯一约束：一个指标在一个项目中只能出现一次
    __table_args__ = (UniqueConstraint('project_id', 'metric_id', name='uq_project_metric'),)

    # 关联关系
    project = relationship("Project", back_populates="project_metrics")
    metric = relationship("Metric")


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
                # ============ 总览 - 年度指标（按维度分类）============

                # 质量维度 - 越小越好
                Metric(
                    name="质量问题数",
                    code="quality_issue_count",
                    category="overview",
                    metric_type="tech",
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
                    metric_type="tech",
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
                    metric_type="tech",
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
                    metric_type="tech",
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
                    metric_type="business",
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
                    metric_type="tech",
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
                    metric_type="tech",
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
                    metric_type="tech",
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
                    metric_type="tech",
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
                    metric_type="business",
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
                    metric_type="business",
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
                    metric_type="business",
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
