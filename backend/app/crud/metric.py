"""
指标 CRUD 操作
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.models import Metric, MetricHistory
from app.schemas import MetricCreate, MetricUpdate
from app.crud.aggregation import AggregationCRUD


class MetricCRUD:
    """指标CRUD操作类"""

    @staticmethod
    def create(db: Session, metric: MetricCreate) -> Metric:
        """创建新指标"""
        # 排除 source_configs 字段，它不是 Metric 模型的属性
        metric_data = metric.model_dump(exclude={'source_configs'})
        db_metric = Metric(**metric_data)
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
        dimension: Optional[str] = None,
        is_active: Optional[bool] = None,
        keyword: Optional[str] = None
    ) -> tuple[List[Metric], int]:
        """获取指标列表（支持分页和筛选）"""
        query = db.query(Metric)

        # 分类筛选
        if category:
            query = query.filter(Metric.category == category)

        # 维度筛选
        if dimension:
            query = query.filter(Metric.dimension == dimension)

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

        # 如果是子产品类别指标，触发聚合重新计算
        if db_metric.category != 'overview':
            now = datetime.now()
            AggregationCRUD.recompute_by_source(db, metric_id, now.year, now.month)

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
        """批量更新指标值，只保存历史记录到 MetricHistory"""
        count = 0
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        updated_source_ids = set()

        for code, value in updates.items():
            metric = MetricCRUD.get_by_code(db, code)
            if metric:
                # 只保存到 MetricHistory（当前年月）
                existing_history = db.query(MetricHistory).filter(
                    MetricHistory.metric_id == metric.id,
                    MetricHistory.year == current_year,
                    MetricHistory.month == current_month
                ).first()
                if existing_history:
                    existing_history.value = value
                else:
                    history = MetricHistory(
                        metric_id=metric.id,
                        year=current_year,
                        month=current_month,
                        value=value
                    )
                    db.add(history)
                count += 1
                updated_source_ids.add(metric.id)

        db.commit()

        # 触发聚合更新：当子产品指标更新时，自动更新相关的聚合指标
        for source_id in updated_source_ids:
            AggregationCRUD.recompute_by_source(db, source_id, current_year, current_month)

        return count


class MetricHistoryCRUD:
    """月度历史 CRUD 操作类"""

    @staticmethod
    def get_monthly_data_for_category(db: Session, category: str, year: int) -> dict:
        """获取指定分类和年份的所有指标月度历史数据"""
        # overview 类别：有聚合配置的指标实时计算，无聚合配置的指标使用存储值
        if category == 'overview':
            overview_metrics = db.query(Metric).filter(
                Metric.category == 'overview',
                Metric.is_active == True
            ).all()
            data = {}
            for metric in overview_metrics:
                # 检查是否有聚合配置
                configs = AggregationCRUD.get_configs_by_target(db, metric.id)
                if configs:
                    # 有聚合配置 → 实时计算
                    computed = AggregationCRUD.compute_for_year(db, metric.id, year)
                    if computed:
                        data[metric.code] = computed
                else:
                    # 无聚合配置 → 读取存储的历史数据
                    history_records = db.query(MetricHistory).filter(
                        MetricHistory.metric_id == metric.id,
                        MetricHistory.year == year
                    ).all()
                    if history_records:
                        data[metric.code] = {}
                        for h in history_records:
                            data[metric.code][h.month] = {
                                'value': h.value,
                                'data_source_link': h.data_source_link,
                            }
            return data

        # sub-product 类别使用存储的历史数据
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
            data[metric.code][history.month] = {
                'value': history.value,
                'data_source_link': history.data_source_link,
            }
        return data

    @staticmethod
    def bulk_create(db: Session, records: list) -> dict:
        """批量创建或更新历史记录"""
        from app.models import MetricHistory
        created = 0
        updated = 0
        for record in records:
            existing = db.query(MetricHistory).filter(
                MetricHistory.metric_id == record.metric_id,
                MetricHistory.year == record.year,
                MetricHistory.month == record.month
            ).first()
            if existing:
                existing.value = record.value
                if hasattr(record, 'data_source_link') and record.data_source_link is not None:
                    existing.data_source_link = record.data_source_link
                updated += 1
            else:
                db.add(record)
                created += 1
        db.commit()
        return {"created": created, "updated": updated}
