"""专项项目 CRUD 操作"""
from sqlalchemy.orm import Session
from typing import Optional, List

from app.models.special_project import SpecialProject, SpecialProjectTarget
from app.schemas.special_project import SpecialProjectCreate, SpecialProjectUpdate, SpecialProjectTargetCreate, SpecialProjectTargetUpdate


class SpecialProjectCRUD:
    """专项项目CRUD操作类"""

    @staticmethod
    def create(db: Session, project: SpecialProjectCreate) -> SpecialProject:
        """创建新项目及其目标"""
        # 创建项目
        project_data = project.model_dump(exclude={'targets'})
        db_project = SpecialProject(**project_data)
        db.add(db_project)
        db.flush()  # 获取项目ID

        # 创建目标
        for target_data in project.targets:
            target_dict = target_data.model_dump()
            # 计算 achievement_rate
            if target_dict.get('target_value', 0) > 0:
                target_dict['achievement_rate'] = (target_dict.get('current_value', 0) / target_dict['target_value']) * 100
            else:
                target_dict['achievement_rate'] = 0
            db_target = SpecialProjectTarget(
                project_id=db_project.id,
                **target_dict
            )
            db.add(db_target)

        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def get_by_id(db: Session, project_id: int) -> Optional[SpecialProject]:
        """根据ID获取项目"""
        return db.query(SpecialProject).filter(SpecialProject.id == project_id).first()

    @staticmethod
    def get_list(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        keyword: Optional[str] = None
    ) -> tuple[List[SpecialProject], int]:
        """获取项目列表（支持分页和筛选）"""
        query = db.query(SpecialProject)

        # 状态筛选
        if status:
            query = query.filter(SpecialProject.status == status)

        # 关键词搜索
        if keyword:
            query = query.filter(
                (SpecialProject.sub_project.contains(keyword)) |
                (SpecialProject.responsible_person.contains(keyword))
            )

        # 获取总数
        total = query.count()

        # 分页
        items = query.order_by(SpecialProject.updated_at.desc()).offset(skip).limit(limit).all()

        return items, total

    @staticmethod
    def update(db: Session, project_id: int, project: SpecialProjectUpdate) -> Optional[SpecialProject]:
        """更新项目（含目标同步）"""
        db_project = SpecialProjectCRUD.get_by_id(db, project_id)
        if not db_project:
            return None

        # 更新项目基础字段（排除 targets）
        update_data = project.model_dump(exclude_unset=True, exclude={'targets'})
        for field, value in update_data.items():
            setattr(db_project, field, value)

        # 同步目标：先删后增
        if project.targets is not None:
            for existing_target in db_project.targets:
                db.delete(existing_target)
            db.flush()

            for target_data in project.targets:
                target_dict = target_data.model_dump()
                # 计算 achievement_rate
                if target_dict.get('target_value', 0) > 0:
                    target_dict['achievement_rate'] = (target_dict.get('current_value', 0) / target_dict['target_value']) * 100
                else:
                    target_dict['achievement_rate'] = 0
                db_target = SpecialProjectTarget(
                    project_id=db_project.id,
                    **target_dict
                )
                db.add(db_target)

        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def delete(db: Session, project_id: int) -> bool:
        """删除项目（级联删除目标）"""
        db_project = SpecialProjectCRUD.get_by_id(db, project_id)
        if not db_project:
            return False

        db.delete(db_project)
        db.commit()
        return True

    @staticmethod
    def update_budget_used(db: Session, project_id: int, used_days: float) -> Optional[SpecialProject]:
        """更新预算使用人天"""
        db_project = SpecialProjectCRUD.get_by_id(db, project_id)
        if not db_project:
            return None

        db_project.budget_used_days = used_days
        db.commit()
        db.refresh(db_project)
        return db_project


class SpecialProjectTargetCRUD:
    """目标CRUD操作类"""

    @staticmethod
    def create(db: Session, project_id: int, target: SpecialProjectTargetCreate) -> SpecialProjectTarget:
        """为项目创建目标"""
        db_target = SpecialProjectTarget(
            project_id=project_id,
            **target.model_dump()
        )
        db.add(db_target)
        db.commit()
        db.refresh(db_target)
        return db_target

    @staticmethod
    def get_by_id(db: Session, target_id: int) -> Optional[SpecialProjectTarget]:
        """根据ID获取目标"""
        return db.query(SpecialProjectTarget).filter(SpecialProjectTarget.id == target_id).first()

    @staticmethod
    def update(db: Session, target_id: int, target: SpecialProjectTargetUpdate) -> Optional[SpecialProjectTarget]:
        """更新目标"""
        db_target = SpecialProjectTargetCRUD.get_by_id(db, target_id)
        if not db_target:
            return None

        update_data = target.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_target, field, value)

        # 计算达成率
        if db_target.target_value > 0:
            db_target.achievement_rate = (db_target.current_value / db_target.target_value) * 100

        db.commit()
        db.refresh(db_target)
        return db_target

    @staticmethod
    def delete(db: Session, target_id: int) -> bool:
        """删除目标"""
        db_target = SpecialProjectTargetCRUD.get_by_id(db, target_id)
        if not db_target:
            return False

        db.delete(db_target)
        db.commit()
        return True

    @staticmethod
    def update_current_value(db: Session, target_id: int, current_value: float) -> Optional[SpecialProjectTarget]:
        """更新当前值并重新计算达成率"""
        db_target = SpecialProjectTargetCRUD.get_by_id(db, target_id)
        if not db_target:
            return None

        db_target.current_value = current_value
        if db_target.target_value > 0:
            db_target.achievement_rate = (current_value / db_target.target_value) * 100

        db.commit()
        db.refresh(db_target)
        return db_target
