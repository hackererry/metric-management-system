"""ORM 模型 - 导入此模块将所有表注册到 Base.metadata"""
from app.models.metric import Metric, MetricHistory
from app.models.special_project import SpecialProject, SpecialProjectTarget

__all__ = ["Metric", "MetricHistory", "SpecialProject", "SpecialProjectTarget"]
