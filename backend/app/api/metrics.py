"""
指标管理 API 路由（统一 POST）
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas import (
    MetricCreate,
    MetricUpdate,
    MetricResponse,
    MetricListResponse,
    CategoryStats,
    MetricHistoryCreate,
    MetricListRequest,
    MetricGetRequest,
    MetricDeleteRequest,
    MetricUpdateRequest,
    MetricCategoryQueryRequest,
    MetricHistoryQueryRequest,
)
from app.crud import MetricCRUD, MetricHistoryCRUD

router = APIRouter(prefix="/api/metrics", tags=["指标管理"])

# 有效的分类列表
VALID_CATEGORIES = ['overview', 'product_a', 'product_b', 'product_c', 'product_d']


@router.post("/create", response_model=MetricResponse, summary="创建指标")
async def create_metric(
    metric: MetricCreate,
    db: Session = Depends(get_db)
):
    """
    创建新的指标

    - **name**: 指标名称
    - **code**: 指标编码（唯一）
    - **category**: 所属分类（overview/product_a/product_b/product_c/product_d）
    - **dimension**: 维度（quality/efficiency/experience/business/operation）
    - **data_type**: 数据类型（number/percentage/trend）
    - **value**: 当前值
    """
    # 检查编码是否已存在
    existing = MetricCRUD.get_by_code(db, metric.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"指标编码 '{metric.code}' 已存在")

    return MetricCRUD.create(db, metric)


@router.post("/list", response_model=MetricListResponse, summary="获取指标列表")
async def get_metrics(
    request: MetricListRequest,
    db: Session = Depends(get_db)
):
    """
    获取指标列表，支持分页和筛选

    - **skip**: 分页偏移量
    - **limit**: 每页数量
    - **category**: 按分类筛选
    - **is_active**: 按状态筛选
    - **keyword**: 搜索关键词（匹配名称、编码、描述）
    """
    items, total = MetricCRUD.get_list(
        db,
        skip=request.skip,
        limit=request.limit,
        category=request.category,
        is_active=request.is_active,
        keyword=request.keyword
    )
    return {"total": total, "items": items}


@router.post("/stats", summary="获取分类统计")
async def get_category_stats(db: Session = Depends(get_db)):
    """获取各分类的指标统计信息"""
    stats = MetricCRUD.get_category_stats(db)
    return {"code": 200, "message": "success", "data": stats}


@router.post("/history/query", summary="获取分类月度历史数据")
async def get_monthly_history(
    request: MetricHistoryQueryRequest,
    db: Session = Depends(get_db)
):
    """
    获取指定分类和年份的所有指标月度历史数据

    - **category**: 分类名称（overview/product_a/product_b/product_c/product_d）
    - **year**: 年份

    返回格式: {"metric_code": {1: value, 2: value, ...}}
    """
    if request.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"无效的分类，可选值: {', '.join(VALID_CATEGORIES)}")
    return MetricHistoryCRUD.get_monthly_data_for_category(db, request.category, request.year)


@router.post("/history/batch", summary="批量写入月度历史")
async def batch_create_history(
    records: list[MetricHistoryCreate],
    db: Session = Depends(get_db)
):
    """批量创建月度历史记录"""
    from app.models import MetricHistory
    objs = [MetricHistory(**r.model_dump()) for r in records]
    MetricHistoryCRUD.bulk_create(db, objs)
    return {"code": 200, "message": f"成功写入 {len(records)} 条历史记录"}


@router.post("/category/grouped", summary="按分类获取分组指标")
async def get_metrics_by_category_grouped(
    request: MetricCategoryQueryRequest,
    db: Session = Depends(get_db)
):
    """
    根据分类获取指标，按维度分组返回

    - **category**: 分类名称（overview/product_a/product_b/product_c/product_d）

    返回格式:
    {
        "quality": [质量指标列表],
        "efficiency": [效率指标列表],
        "experience": [体验指标列表],
        "business": [经营指标列表],
        "operation": [运作指标列表]
    }
    """
    if request.category not in VALID_CATEGORIES:
        return {}

    return MetricCRUD.get_by_category_grouped(db, request.category)


@router.post("/category/query", response_model=list[MetricResponse], summary="按分类获取指标")
async def get_metrics_by_category(
    request: MetricCategoryQueryRequest,
    db: Session = Depends(get_db)
):
    """
    根据分类获取所有启用的指标

    - **category**: 分类名称（overview/product_a/product_b/product_c/product_d）
    """
    if request.category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"无效的分类，可选值: {', '.join(VALID_CATEGORIES)}"
        )

    return MetricCRUD.get_by_category(db, request.category)


@router.post("/get", response_model=MetricResponse, summary="获取单个指标")
async def get_metric(
    request: MetricGetRequest,
    db: Session = Depends(get_db)
):
    """根据ID获取指标详情"""
    metric = MetricCRUD.get_by_id(db, request.id)
    if not metric:
        raise HTTPException(status_code=404, detail="指标不存在")
    return metric


@router.post("/update", response_model=MetricResponse, summary="更新指标")
async def update_metric(
    request: MetricUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    更新指标信息

    只需提供需要更新的字段
    """
    # 如果更新编码，检查是否重复
    if request.code:
        existing = MetricCRUD.get_by_code(db, request.code)
        if existing and existing.id != request.id:
            raise HTTPException(status_code=400, detail=f"指标编码 '{request.code}' 已存在")

    # 构建 MetricUpdate 对象（排除 id）
    update_data = request.model_dump(exclude={'id'}, exclude_unset=True)
    metric_update = MetricUpdate(**update_data)

    updated = MetricCRUD.update(db, request.id, metric_update)
    if not updated:
        raise HTTPException(status_code=404, detail="指标不存在")
    return updated


@router.post("/delete", summary="删除指标")
async def delete_metric(
    request: MetricDeleteRequest,
    db: Session = Depends(get_db)
):
    """删除指定指标"""
    success = MetricCRUD.delete(db, request.id)
    if not success:
        raise HTTPException(status_code=404, detail="指标不存在")
    return {"code": 200, "message": "删除成功"}


@router.post("/batch-update", summary="批量更新指标值")
async def batch_update_values(
    updates: dict[str, float],
    db: Session = Depends(get_db)
):
    """
    批量更新多个指标的值，同时保存历史记录

    请求体格式: {"指标编码": 新值, ...}
    """
    count = MetricCRUD.batch_update_values(db, updates)
    return {"code": 200, "message": f"成功更新 {count} 个指标"}
