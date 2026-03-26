"""
CRUD操作 - 数据库增删改查操作
"""
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from database import Metric, Project, ProjectMetric
from schemas import MetricCreate, MetricUpdate, CategoryEnum, ProjectCreate, ProjectUpdate


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
        metric_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        keyword: Optional[str] = None
    ) -> tuple[List[Metric], int]:
        """获取指标列表（支持分页和筛选）"""
        query = db.query(Metric)

        # 分类筛选
        if category:
            query = query.filter(Metric.category == category)

        # 指标类型筛选
        if metric_type:
            query = query.filter(Metric.metric_type == metric_type)

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
    def get_by_category(db: Session, category: str, metric_type: Optional[str] = None) -> List[Metric]:
        """根据分类获取所有指标"""
        query = db.query(Metric).filter(
            Metric.category == category,
            Metric.is_active == True
        )
        if metric_type:
            query = query.filter(Metric.metric_type == metric_type)
        return query.all()

    @staticmethod
    def get_by_category_grouped(db: Session, category: str) -> dict:
        """根据分类获取指标，按业务/研发分组"""
        metrics = db.query(Metric).filter(
            Metric.category == category,
            Metric.is_active == True
        ).all()

        business_metrics = [m for m in metrics if m.metric_type == 'business']
        tech_metrics = [m for m in metrics if m.metric_type == 'tech']

        return {
            "business": business_metrics,
            "tech": tech_metrics
        }

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
        """批量更新指标值"""
        count = 0
        for code, value in updates.items():
            metric = MetricCRUD.get_by_code(db, code)
            if metric:
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


class ProjectCRUD:
    """项目CRUD操作类"""

    @staticmethod
    def create(db: Session, project: ProjectCreate) -> Project:
        """创建新项目"""
        db_project = Project(**project.model_dump())
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def get_by_id(db: Session, project_id: int) -> Optional[Project]:
        """根据ID获取项目"""
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Project]:
        """根据编码获取项目"""
        return db.query(Project).filter(Project.code == code).first()

    @staticmethod
    def get_list(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        keyword: Optional[str] = None
    ) -> tuple[List[Project], int]:
        """获取项目列表（支持分页和筛选）"""
        query = db.query(Project)

        # 状态筛选
        if status:
            query = query.filter(Project.status == status)

        # 关键词搜索
        if keyword:
            query = query.filter(
                (Project.name.contains(keyword)) |
                (Project.code.contains(keyword)) |
                (Project.description.contains(keyword))
            )

        # 获取总数
        total = query.count()

        # 分页
        items = query.order_by(Project.updated_at.desc()).offset(skip).limit(limit).all()

        return items, total

    @staticmethod
    def update(db: Session, project_id: int, project: ProjectUpdate) -> Optional[Project]:
        """更新项目"""
        db_project = ProjectCRUD.get_by_id(db, project_id)
        if not db_project:
            return None

        # 只更新提供的字段
        update_data = project.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_project, field, value)

        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def delete(db: Session, project_id: int) -> bool:
        """删除项目（级联删除关联）"""
        db_project = ProjectCRUD.get_by_id(db, project_id)
        if not db_project:
            return False

        db.delete(db_project)
        db.commit()
        return True

    @staticmethod
    def add_metric(db: Session, project_id: int, metric_id: int, target_value: Optional[float] = None) -> Optional[ProjectMetric]:
        """添加指标到项目"""
        # 检查是否已存在
        existing = db.query(ProjectMetric).filter(
            ProjectMetric.project_id == project_id,
            ProjectMetric.metric_id == metric_id
        ).first()
        if existing:
            return None  # 已存在

        db_project_metric = ProjectMetric(
            project_id=project_id,
            metric_id=metric_id,
            target_value=target_value
        )
        db.add(db_project_metric)
        db.commit()
        db.refresh(db_project_metric)
        return db_project_metric

    @staticmethod
    def remove_metric(db: Session, project_id: int, metric_id: int) -> bool:
        """从项目移除指标"""
        db_project_metric = db.query(ProjectMetric).filter(
            ProjectMetric.project_id == project_id,
            ProjectMetric.metric_id == metric_id
        ).first()
        if not db_project_metric:
            return False

        db.delete(db_project_metric)
        db.commit()
        return True

    @staticmethod
    def get_project_metrics(db: Session, project_id: int) -> List[dict]:
        """获取项目下所有指标（含达成状态）"""
        project_metrics = db.query(ProjectMetric).options(
            joinedload(ProjectMetric.metric)
        ).filter(ProjectMetric.project_id == project_id).all()

        result = []
        for pm in project_metrics:
            metric = pm.metric
            # 使用项目目标值或指标默认目标值
            target = pm.target_value if pm.target_value is not None else metric.target_value

            # 计算达成状态
            is_achieved = None
            achievement_rate = None
            if target is not None and metric.value is not None:
                if metric.lower_is_better:
                    # 越小越好
                    is_achieved = metric.value <= target
                    if metric.value > 0:
                        achievement_rate = (target / metric.value) * 100
                    else:
                        achievement_rate = 100.0 if is_achieved else 0.0
                else:
                    # 越大越好
                    is_achieved = metric.value >= target
                    if target > 0:
                        achievement_rate = (metric.value / target) * 100
                    else:
                        achievement_rate = 100.0 if is_achieved else 0.0

            result.append({
                "id": pm.id,
                "project_id": pm.project_id,
                "metric_id": pm.metric_id,
                "target_value": pm.target_value,
                "created_at": pm.created_at,
                "metric": metric,
                "is_achieved": is_achieved,
                "achievement_rate": achievement_rate
            })

        return result

    @staticmethod
    def get_project_stats(db: Session, project_id: int) -> dict:
        """获取项目统计（总指标数、达标数、达成率）"""
        project_metrics = ProjectCRUD.get_project_metrics(db, project_id)

        total = len(project_metrics)
        achieved = sum(1 for pm in project_metrics if pm.get("is_achieved") is True)

        # 计算平均达成率
        rates = [pm["achievement_rate"] for pm in project_metrics if pm["achievement_rate"] is not None]
        avg_rate = sum(rates) / len(rates) if rates else 0.0

        return {
            "total_metrics": total,
            "achieved_metrics": achieved,
            "achievement_rate": round(avg_rate, 2)
        }

    @staticmethod
    def get_metric_count(db: Session, project_id: int) -> int:
        """获取项目关联的指标数量"""
        return db.query(ProjectMetric).filter(ProjectMetric.project_id == project_id).count()

    @staticmethod
    def get_achievement_rate(db: Session, project_id: int) -> float:
        """获取项目达成率"""
        stats = ProjectCRUD.get_project_stats(db, project_id)
        return stats["achievement_rate"]
