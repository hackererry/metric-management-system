"""CRUD 操作类"""
from app.crud.metric import MetricCRUD, MetricHistoryCRUD
from app.crud.aggregation import AggregationCRUD

__all__ = ["MetricCRUD", "MetricHistoryCRUD", "AggregationCRUD"]
