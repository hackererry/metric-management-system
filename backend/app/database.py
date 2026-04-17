"""
数据库配置 - 引擎、会话工厂、声明基类
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_aggregation_type_column():
    """确保 metrics 表存在 aggregation_type 列（如果不存在则添加）"""
    with engine.connect() as conn:
        # 检查列是否存在
        try:
            conn.execute(text("SELECT aggregation_type FROM metrics LIMIT 1"))
        except Exception:
            # 列不存在，添加它
            conn.execute(text("ALTER TABLE metrics ADD COLUMN aggregation_type VARCHAR(20) DEFAULT 'average'"))
            conn.commit()


def get_db():
    """FastAPI 依赖：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
