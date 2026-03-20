"""
API路由定义
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas import (
    MetricCreate,
    MetricUpdate,
    MetricResponse,
    MetricListResponse,
    ApiResponse,
    CategoryStats
)
from crud import MetricCRUD

router = APIRouter(prefix="/api/metrics", tags=["指标管理"])

# 有效的分类列表
VALID_CATEGORIES = ['overview', 'product_a', 'product_b', 'product_c', 'product_d']


@router.post("/", response_model=MetricResponse, summary="创建指标")
async def create_metric(
    metric: MetricCreate,
    db: Session = Depends(get_db)
):
    """
    创建新的指标

    - **name**: 指标名称
    - **code**: 指标编码（唯一）
    - **category**: 所属分类（overview/product_a/product_b/product_c）
    - **data_type**: 数据类型（number/percentage/trend）
    - **value**: 当前值
    """
    # 检查编码是否已存在
    existing = MetricCRUD.get_by_code(db, metric.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"指标编码 '{metric.code}' 已存在")

    return MetricCRUD.create(db, metric)


@router.get("/", response_model=MetricListResponse, summary="获取指标列表")
async def get_metrics(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回记录数"),
    category: Optional[str] = Query(None, description="分类筛选"),
    metric_type: Optional[str] = Query(None, description="指标类型筛选: business/tech"),
    is_active: Optional[bool] = Query(None, description="状态筛选"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    db: Session = Depends(get_db)
):
    """
    获取指标列表，支持分页和筛选

    - **skip**: 分页偏移量
    - **limit**: 每页数量
    - **category**: 按分类筛选
    - **metric_type**: 按指标类型筛选（business/tech）
    - **is_active**: 按状态筛选
    - **keyword**: 搜索关键词（匹配名称、编码、描述）
    """
    items, total = MetricCRUD.get_list(
        db,
        skip=skip,
        limit=limit,
        category=category,
        metric_type=metric_type,
        is_active=is_active,
        keyword=keyword
    )
    return {"total": total, "items": items}


@router.get("/stats", summary="获取分类统计")
async def get_category_stats(db: Session = Depends(get_db)):
    """获取各分类的指标统计信息"""
    stats = MetricCRUD.get_category_stats(db)
    return {"code": 200, "message": "success", "data": stats}


# 注意：grouped路由必须放在category路由之前，否则会被category路由先匹配
@router.get("/category/{category}/grouped", summary="按分类获取分组指标")
async def get_metrics_by_category_grouped(
    category: str,
    db: Session = Depends(get_db)
):
    """
    根据分类获取指标，按业务指标/研发指标分组返回

    - **category**: 分类名称（overview/product_a/product_b/product_c/product_d）

    返回格式:
    {
        "business": [业务指标列表],
        "tech": [研发指标列表]
    }
    """
    if category not in VALID_CATEGORIES:
        return {"business": [], "tech": []}

    return MetricCRUD.get_by_category_grouped(db, category)


@router.get("/category/{category}", response_model=list[MetricResponse], summary="按分类获取指标")
async def get_metrics_by_category(
    category: str,
    metric_type: Optional[str] = Query(None, description="指标类型: business/tech"),
    db: Session = Depends(get_db)
):
    """
    根据分类获取所有启用的指标

    - **category**: 分类名称（overview/product_a/product_b/product_c/product_d）
    - **metric_type**: 指标类型（business/tech），不传则返回全部
    """
    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"无效的分类，可选值: {', '.join(VALID_CATEGORIES)}"
        )

    return MetricCRUD.get_by_category(db, category, metric_type)


@router.get("/{metric_id}", response_model=MetricResponse, summary="获取单个指标")
async def get_metric(
    metric_id: int,
    db: Session = Depends(get_db)
):
    """根据ID获取指标详情"""
    metric = MetricCRUD.get_by_id(db, metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="指标不存在")
    return metric


@router.put("/{metric_id}", response_model=MetricResponse, summary="更新指标")
async def update_metric(
    metric_id: int,
    metric: MetricUpdate,
    db: Session = Depends(get_db)
):
    """
    更新指标信息

    只需提供需要更新的字段
    """
    # 如果更新编码，检查是否重复
    if metric.code:
        existing = MetricCRUD.get_by_code(db, metric.code)
        if existing and existing.id != metric_id:
            raise HTTPException(status_code=400, detail=f"指标编码 '{metric.code}' 已存在")

    updated = MetricCRUD.update(db, metric_id, metric)
    if not updated:
        raise HTTPException(status_code=404, detail="指标不存在")
    return updated


@router.delete("/{metric_id}", summary="删除指标")
async def delete_metric(
    metric_id: int,
    db: Session = Depends(get_db)
):
    """删除指定指标"""
    success = MetricCRUD.delete(db, metric_id)
    if not success:
        raise HTTPException(status_code=404, detail="指标不存在")
    return {"code": 200, "message": "删除成功"}


@router.post("/batch-update", summary="批量更新指标值")
async def batch_update_values(
    updates: dict[str, float],
    db: Session = Depends(get_db)
):
    """
    批量更新多个指标的值

    请求体格式: {"指标编码": 新值, ...}
    """
    count = MetricCRUD.batch_update_values(db, updates)
    return {"code": 200, "message": f"成功更新 {count} 个指标"}
