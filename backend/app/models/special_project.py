"""专项项目 ORM 模型"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class SpecialProject(Base):
    """专项项目数据模型"""
    __tablename__ = "special_projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sub_project = Column(String(100), nullable=False, comment="子项目名称")
    responsible_person = Column(String(50), nullable=False, comment="责任人")
    project_manager = Column(String(50), nullable=False, comment="项目经理")
    budget_person_days = Column(Float, nullable=False, comment="预算投入(人天)")
    budget_used_days = Column(Float, default=0, comment="已使用人天")
    status = Column(String(20), default="planning", comment="项目状态: planning/in_progress/on_hold/completed/cancelled")
    remarks = Column(Text, nullable=True, comment="备注说明")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    # 关联目标
    targets = relationship("SpecialProjectTarget", back_populates="project", cascade="all, delete-orphan")


class SpecialProjectTarget(Base):
    """专项项目目标模型（支持多目标）"""
    __tablename__ = "special_project_targets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("special_projects.id", ondelete="CASCADE"), nullable=False, comment="关联项目ID")
    target_name = Column(String(100), nullable=False, comment="目标名称")
    target_value = Column(Float, nullable=False, comment="目标值")
    current_value = Column(Float, default=0, comment="当前值")
    unit = Column(String(20), nullable=True, comment="单位")
    weight = Column(Float, default=1.0, comment="权重")
    achievement_rate = Column(Float, default=0, comment="目标达成率(%)")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    # 关联到项目
    project = relationship("SpecialProject", back_populates="targets")

    __table_args__ = (
        UniqueConstraint('project_id', 'target_name', name='uq_project_target_name'),
    )
