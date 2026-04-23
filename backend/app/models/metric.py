"""指标 ORM 模型"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, UniqueConstraint
from datetime import datetime

from app.database import Base


class Metric(Base):
    """指标数据模型"""
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="指标名称")
    code = Column(String(50), unique=True, nullable=False, comment="指标编码")
    category = Column(String(50), nullable=False, comment="所属分类: overview/product_a/product_b/product_c/product_d")
    data_type = Column(String(20), nullable=False, comment="数据类型: number/percentage/trend")
    dimension = Column(String(20), nullable=False, comment="维度: quality/efficiency/experience/business/operation")
    lower_is_better = Column(Boolean, default=True, comment="达标条件: True表示越小越好, False表示越大越好")
    unit = Column(String(20), comment="单位")
    target_value = Column(Float, comment="达标值")
    challenge_value = Column(Float, nullable=True, comment="挑战值")
    aggregation_type = Column(String(20), default="average", comment="年度汇总方式: sum(求和)/average(平均)")
    data_source_link = Column(String(500), nullable=True, comment="数据来源链接")
    description = Column(Text, comment="指标描述")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class MetricHistory(Base):
    """指标月度历史数据模型"""
    __tablename__ = "metric_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    metric_id = Column(Integer, ForeignKey("metrics.id", ondelete="CASCADE"), nullable=False, comment="关联指标ID")
    year = Column(Integer, nullable=False, comment="年份")
    month = Column(Integer, nullable=False, comment="月份 1-12")
    value = Column(Float, nullable=False, comment="该月指标值")
    data_source_link = Column(String(500), nullable=True, comment="数据来源链接")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (UniqueConstraint('metric_id', 'year', 'month', name='uq_metric_year_month'),)
