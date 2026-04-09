"""
应用配置 - 使用 pydantic-settings 管理配置项
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置类，支持环境变量覆盖"""
    DATABASE_URL: str = "sqlite:///./metrics_final.db"
    DEBUG: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
