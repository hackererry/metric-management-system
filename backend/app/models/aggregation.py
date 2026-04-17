"""指标聚合配置模型"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from app.database import Base


class MetricAggregationConfig(Base):
    """指标聚合配置 - 定义子产品指标如何聚合到产品部指标"""
    __tablename__ = "metric_aggregation_configs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    target_metric_id = Column(Integer, ForeignKey("metrics.id", ondelete="CASCADE"), nullable=False, comment="目标指标ID(产品部)")
    source_metric_id = Column(Integer, ForeignKey("metrics.id", ondelete="CASCADE"), nullable=False, comment="源指标ID(子产品)")
    aggregation_type = Column(String(20), nullable=False, comment="聚合方式: sum/average")
    weight = Column(Float, default=1.0, comment="权重(用于加权平均)")

    __table_args__ = (
        UniqueConstraint('target_metric_id', 'source_metric_id', name='uq_target_source'),
    )
