"""
指标 CRUD 操作
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.models import Metric, MetricHistory
from app.schemas import MetricCreate, MetricUpdate


class MetricCRUD:
    """指标CRUD操作类"""

    @staticmethod
    def create(db: Session, metric: MetricCreate) -> Metric:
        """创建新指标"""
        db_metric = Metric(**metric.model_dump())
        db.add(db_metric)
        db.commit()
        db.refresh(db_metric)
        return db_metric

    @staticmethod
    def get_by_id(db: Session, metric_id: int) -> Optional[Metric]:
        """根据ID获取指标"""
        return db.query(Metric).filter(Metric.id == metric_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Metric]:
        """根据编码获取指标"""
        return db.query(Metric).filter(Metric.code == code).first()

    @staticmethod
    def get_list(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        keyword: Optional[str] = None
    ) -> tuple[List[Metric], int]:
        """获取指标列表（支持分页和筛选）"""
        query = db.query(Metric)

        # 分类筛选
        if category:
            query = query.filter(Metric.category == category)

        # 状态筛选
        if is_active is not None:
            query = query.filter(Metric.is_active == is_active)

        # 关键词搜索
        if keyword:
            query = query.filter(
                (Metric.name.contains(keyword)) |
                (Metric.code.contains(keyword)) |
                (Metric.description.contains(keyword))
            )

        # 获取总数
        total = query.count()

        # 分页
        items = query.order_by(Metric.updated_at.desc()).offset(skip).limit(limit).all()

        return items, total

    @staticmethod
    def update(db: Session, metric_id: int, metric: MetricUpdate) -> Optional[Metric]:
        """更新指标"""
        db_metric = MetricCRUD.get_by_id(db, metric_id)
        if not db_metric:
            return None

        # 只更新提供的字段
        update_data = metric.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_metric, field, value)

        db.commit()
        db.refresh(db_metric)
        return db_metric

    @staticmethod
    def delete(db: Session, metric_id: int) -> bool:
        """删除指标"""
        db_metric = MetricCRUD.get_by_id(db, metric_id)
        if not db_metric:
            return False

        db.delete(db_metric)
        db.commit()
        return True

    @staticmethod
    def get_by_category(db: Session, category: str) -> List[Metric]:
        """根据分类获取所有活跃指标"""
        return db.query(Metric).filter(
            Metric.category == category,
            Metric.is_active == True
        ).all()

    @staticmethod
    def get_by_category_grouped(db: Session, category: str) -> dict:
        """根据分类获取指标，按维度分组"""
        metrics = db.query(Metric).filter(
            Metric.category == category,
            Metric.is_active == True
        ).all()

        grouped = {}
        for m in metrics:
            dim = m.dimension or 'uncategorized'
            if dim not in grouped:
                grouped[dim] = []
            grouped[dim].append(m)

        return grouped

    @staticmethod
    def get_category_stats(db: Session) -> dict:
        """获取各分类统计信息"""
        stats = {}
        categories = ['overview', 'product_a', 'product_b', 'product_c', 'product_d']

        for cat in categories:
            total = db.query(Metric).filter(Metric.category == cat).count()
            active = db.query(Metric).filter(
                Metric.category == cat,
                Metric.is_active == True
            ).count()
            stats[cat] = {
                "total": total,
                "active": active
            }

        return stats

    @staticmethod
    def batch_update_values(db: Session, updates: dict) -> int:
        """批量更新指标值，并保存历史记录"""
        count = 0
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        for code, value in updates.items():
            metric = MetricCRUD.get_by_code(db, code)
            if metric:
                # 保存当前值到历史记录
                existing_history = db.query(MetricHistory).filter(
                    MetricHistory.metric_id == metric.id,
                    MetricHistory.year == current_year,
                    MetricHistory.month == current_month
                ).first()
                if existing_history:
                    existing_history.value = metric.value
                else:
                    history = MetricHistory(
                        metric_id=metric.id,
                        year=current_year,
                        month=current_month,
                        value=metric.value
                    )
                    db.add(history)

                metric.previous_value = metric.value
                metric.value = value
                # 自动计算趋势
                if metric.previous_value:
                    if value > metric.previous_value:
                        metric.trend = "up"
                    elif value < metric.previous_value:
                        metric.trend = "down"
                    else:
                        metric.trend = "stable"
                count += 1
        db.commit()
        return count


class MetricHistoryCRUD:
    """月度历史 CRUD 操作类"""

    @staticmethod
    def get_monthly_data_for_category(db: Session, category: str, year: int) -> dict:
        """获取指定分类和年份的所有指标月度历史数据"""
        results = db.query(MetricHistory, Metric).join(
            Metric, MetricHistory.metric_id == Metric.id
        ).filter(
            Metric.category == category,
            MetricHistory.year == year
        ).all()

        data = {}
        for history, metric in results:
            if metric.code not in data:
                data[metric.code] = {}
            data[metric.code][history.month] = history.value
        return data

    @staticmethod
    def bulk_create(db: Session, records: list) -> None:
        """批量创建历史记录"""
        db.add_all(records)
        db.commit()
