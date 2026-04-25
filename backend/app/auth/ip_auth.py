"""
IP白名单权限认证模块
- 白名单IP拥有写权限（非白名单IP仅有查看权限）
- 支持细粒度权限控制：all, overview, product_a, product_b, product_c, product_d
- 支持单IP、IP列表、CIDR网段三种配置形式
- 配置文件支持热更新，无需重启服务
"""
import ipaddress
from pathlib import Path
from typing import Optional, List

import yaml
from fastapi import HTTPException, Request, Depends
from pydantic import BaseModel, field_validator


class IPWhitelistEntry(BaseModel):
    """IP白名单条目 - 支持单IP、IP列表、CIDR三种形式"""
    ip: Optional[str] = None           # 单IP（向后兼容）
    ips: Optional[List[str]] = None   # IP列表
    cidr: Optional[str] = None        # CIDR网段
    permissions: List[str]            # ["all"] 或 ["product_a", "product_b"] 等

    @field_validator("permissions", mode="before")
    @classmethod
    def parse_permissions(cls, v):
        if isinstance(v, str):
            return [v]
        return v

    def get_ips(self) -> List[str]:
        """展开为IP列表"""
        result = []
        if self.ip:
            result.append(self.ip)
        if self.ips:
            result.extend(self.ips)
        if self.cidr:
            result.extend(self._parse_cidr(self.cidr))
        return result

    @staticmethod
    def _parse_cidr(cidr_str: str) -> List[str]:
        """解析CIDR网段为IP列表"""
        try:
            network = ipaddress.ip_network(cidr_str, strict=False)
            return [str(ip) for ip in network.hosts()]
        except ValueError:
            return []

    def model_post_init(self, __context):
        # 校验至少指定了一种IP形式
        if not self.ip and not self.ips and not self.cidr:
            raise ValueError("必须指定 ip、ips 或 cidr 之一")


class IPWhitelistConfig(BaseModel):
    """IP白名单配置"""
    whitelist: List[IPWhitelistEntry]


class IPWhitelistManager:
    """IP白名单管理器"""

    # 配置文件的路径
    CONFIG_PATH = Path(__file__).parent.parent.parent / "ip_whitelist.yaml"

    def __init__(self):
        self._config: Optional[IPWhitelistConfig] = None
        self._config_mtime: Optional[float] = None
        self.load_config()

    def load_config(self) -> None:
        """加载配置文件，支持热更新"""
        config_path = self.CONFIG_PATH

        if not config_path.exists():
            # 配置文件不存在，创建默认配置
            self._config = IPWhitelistConfig(whitelist=[])
            self._save_config()
            return

        # 检查文件是否更新
        current_mtime = config_path.stat().st_mtime
        if self._config_mtime != current_mtime:
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f) or {}
                self._config = IPWhitelistConfig(**data)
                self._config_mtime = current_mtime
            except Exception as e:
                # 配置解析失败，保持旧配置
                pass

    def _save_config(self) -> None:
        """保存配置文件"""
        config_path = self.CONFIG_PATH
        config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(self._config.model_dump(), f, allow_unicode=True, default_flow_style=False)

    def get_permissions(self, ip: str) -> List[str]:
        """获取IP的权限列表"""
        self.load_config()
        if not self._config:
            return []

        try:
            target_ip = ipaddress.ip_address(ip)
        except ValueError:
            return []

        for entry in self._config.whitelist:
            # 检查单IP
            if entry.ip:
                try:
                    if target_ip == ipaddress.ip_address(entry.ip):
                        return entry.permissions
                except ValueError:
                    pass

            # 检查IP列表
            if entry.ips:
                for entry_ip_str in entry.ips:
                    try:
                        if target_ip == ipaddress.ip_address(entry_ip_str):
                            return entry.permissions
                    except ValueError:
                        pass

            # 检查CIDR网段
            if entry.cidr:
                try:
                    network = ipaddress.ip_network(entry.cidr, strict=False)
                    if target_ip in network:
                        return entry.permissions
                except ValueError:
                    pass

        return []

    def has_write_permission(self, ip: str, category: Optional[str] = None) -> bool:
        """
        检查IP是否有写权限

        Args:
            ip: 客户端IP地址
            category: 指标分类（如 product_a, overview 等），如果为 None 则检查是否有任意写权限

        Returns:
            bool: 是否有写权限
        """
        self.load_config()
        permissions = self.get_permissions(ip)

        # 非白名单IP没有写权限
        if not permissions:
            return False

        # 白名单IP有写权限
        if "all" in permissions:
            return True

        # 按分类细粒度控制
        if category and category in permissions:
            return True

        return False

    def is_whitelisted(self, ip: str) -> bool:
        """检查IP是否在白名单中"""
        return len(self.get_permissions(ip)) > 0


# 全局单例
_ip_whitelist_manager: Optional[IPWhitelistManager] = None


def get_ip_whitelist_manager() -> IPWhitelistManager:
    """获取IP白名单管理器单例"""
    global _ip_whitelist_manager
    if _ip_whitelist_manager is None:
        _ip_whitelist_manager = IPWhitelistManager()
    return _ip_whitelist_manager


def get_client_ip(request: Request) -> str:
    """
    从请求中提取客户端真实IP

    优先顺序：
    1. X-Real-IP 请求头（前端传递的浏览器真实IP）
    2. X-Forwarded-For 请求头（可能有多个IP，取第一个）
    3. Forwarded header (RFC 7239)
    4. 直接连接：client[0]
    """
    # 优先从 X-Real-IP 获取（前端传递的浏览器真实IP）
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    # X-Forwarded-For（可能有多个IP，取第一个）
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    # Forwarded header (RFC 7239)
    forwarded = request.headers.get("Forwarded")
    if forwarded:
        parts = dict(p.strip().split("=") for p in forwarded.split(",") if "=" in p)
        if "for" in parts:
            return parts["for"].strip()

    # 直接连接
    if request.client:
        return request.client.host

    return "unknown"


def ip_whitelist_dependency(
    request: Request,
    category: Optional[str] = None
):
    """
    FastAPI Depends 依赖：校验IP写权限

    用于需要写权限的端点

    Args:
        category: 指标分类，如 product_a, overview 等

    Raises:
        HTTPException: 403 如果IP没有写权限
    """
    client_ip = get_client_ip(request)
    manager = get_ip_whitelist_manager()

    if not manager.has_write_permission(client_ip, category):
        raise HTTPException(
            status_code=403,
            detail=f"IP {client_ip} 没有写权限"
        )

    return client_ip


def check_ip_write_permission(
    request: Request,
    category: Optional[str] = None
) -> bool:
    """
    检查IP写权限（不抛异常）

    Returns:
        bool: 是否有写权限
    """
    client_ip = get_client_ip(request)
    manager = get_ip_whitelist_manager()
    return manager.has_write_permission(client_ip, category)
