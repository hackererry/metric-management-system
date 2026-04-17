"""
指标聚合配置 CRUD 操作
"""
from sqlalchemy.orm import Session
from typing import Optional, List

from app.models import MetricAggregationConfig, Metric
from app.schemas import AggregationConfigCreate


class AggregationCRUD:
    """聚合配置 CRUD 操作类"""

    @staticmethod
    def get_by_id(db: Session, config_id: int) -> Optional[MetricAggregationConfig]:
        """根据ID获取聚合配置"""
        return db.query(MetricAggregationConfig).filter(
            MetricAggregationConfig.id == config_id
        ).first()

    @staticmethod
    def get_configs_by_target(db: Session, target_metric_id: int) -> List[MetricAggregationConfig]:
        """根据目标指标ID获取所有源配置"""
        return db.query(MetricAggregationConfig).filter(
            MetricAggregationConfig.target_metric_id == target_metric_id
        ).all()

    @staticmethod
    def get_configs_by_source(db: Session, source_metric_id: int) -> List[MetricAggregationConfig]:
        """根据源指标ID获取所有目标配置"""
        return db.query(MetricAggregationConfig).filter(
            MetricAggregationConfig.source_metric_id == source_metric_id
        ).all()

    @staticmethod
    def get_all(db: Session) -> List[MetricAggregationConfig]:
        """获取所有聚合配置"""
        return db.query(MetricAggregationConfig).all()

    @staticmethod
    def create(db: Session, config: AggregationConfigCreate) -> MetricAggregationConfig:
        """创建聚合配置"""
        db_config = MetricAggregationConfig(**config.model_dump())
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config

    @staticmethod
    def delete(db: Session, config_id: int) -> bool:
        """删除聚合配置"""
        db_config = AggregationCRUD.get_by_id(db, config_id)
        if not db_config:
            return False
        db.delete(db_config)
        db.commit()
        return True

    @staticmethod
    def compute_aggregated_value(db: Session, target_metric_id: int) -> Optional[float]:
        """计算目标指标的聚合值"""
        configs = AggregationCRUD.get_configs_by_target(db, target_metric_id)
        if not configs:
            return None

        values = []
        weights = []
        for cfg in configs:
            source_metric = db.query(Metric).filter(Metric.id == cfg.source_metric_id).first()
            if source_metric:
                values.append(source_metric.value * cfg.weight)
                weights.append(cfg.weight)

        if not values:
            return None

        # 检查聚合类型
        first_type = configs[0].aggregation_type
        if first_type == "sum":
            result = sum(v for v in values)
        else:  # average
            total_weight = sum(weights)
            if total_weight == 0:
                result = sum(values)
            else:
                result = sum(v for v in values) / len(values) if len(values) == 1 else sum(v for v in values) / total_weight * sum(weights)

        return round(result, 2)

    @staticmethod
    def recompute_by_source(db: Session, source_metric_id: int) -> List[int]:
        """当源指标更新时，重新计算所有相关的目标指标"""
        # 找到所有以该源指标为来源的目标指标
        configs = AggregationCRUD.get_configs_by_source(db, source_metric_id)
        updated_target_ids = []

        for cfg in configs:
            # 计算新的聚合值
            new_value = AggregationCRUD.compute_aggregated_value(db, cfg.target_metric_id)
            if new_value is not None:
                target_metric = db.query(Metric).filter(Metric.id == cfg.target_metric_id).first()
                if target_metric:
                    target_metric.previous_value = target_metric.value
                    target_metric.value = new_value
                    # 自动计算趋势
                    if target_metric.previous_value:
                        if new_value > target_metric.previous_value:
                            target_metric.trend = "up"
                        elif new_value < target_metric.previous_value:
                            target_metric.trend = "down"
                        else:
                            target_metric.trend = "stable"
                    updated_target_ids.append(cfg.target_metric_id)

        if updated_target_ids:
            db.commit()

        return updated_target_ids

    @staticmethod
    def recompute_all(db: Session) -> int:
        """重新计算所有聚合指标"""
        all_configs = AggregationCRUD.get_all(db)
        target_ids = set(cfg.target_metric_id for cfg in all_configs)

        for target_id in target_ids:
            new_value = AggregationCRUD.compute_aggregated_value(db, target_id)
            if new_value is not None:
                target_metric = db.query(Metric).filter(Metric.id == target_id).first()
                if target_metric:
                    target_metric.previous_value = target_metric.value
                    target_metric.value = new_value
                    if target_metric.previous_value:
                        if new_value > target_metric.previous_value:
                            target_metric.trend = "up"
                        elif new_value < target_metric.previous_value:
                            target_metric.trend = "down"
                        else:
                            target_metric.trend = "stable"

        db.commit()
        return len(target_ids)
