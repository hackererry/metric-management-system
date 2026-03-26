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
    CategoryStats,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectMetricCreate,
    ProjectMetricResponse,
    ProjectStats
)
from crud import MetricCRUD, ProjectCRUD

# 指标管理路由
router = APIRouter(prefix="/api/metrics", tags=["指标管理"])

# 项目管理路由
project_router = APIRouter(prefix="/api/projects", tags=["项目管理"])

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


# ============ 项目管理 API ============

VALID_PROJECT_STATUSES = ['active', 'completed', 'archived']


@project_router.post("/", response_model=ProjectResponse, summary="创建项目")
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db)
):
    """
    创建新的项目专题

    - **name**: 项目名称
    - **code**: 项目编码（唯一）
    - **description**: 项目描述
    - **status**: 状态（active/completed/archived）
    - **start_date**: 开始日期
    - **end_date**: 结束日期
    """
    # 检查编码是否已存在
    if project.code:
        existing = ProjectCRUD.get_by_code(db, project.code)
        if existing:
            raise HTTPException(status_code=400, detail=f"项目编码 '{project.code}' 已存在")

    db_project = ProjectCRUD.create(db, project)
    # 添加统计信息
    response = ProjectResponse.model_validate(db_project)
    response.metric_count = 0
    response.achievement_rate = 0.0
    return response


@project_router.get("/", response_model=ProjectListResponse, summary="获取项目列表")
async def get_projects(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回记录数"),
    status: Optional[str] = Query(None, description="状态筛选: active/completed/archived"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    db: Session = Depends(get_db)
):
    """
    获取项目列表，支持分页和筛选

    - **skip**: 分页偏移量
    - **limit**: 每页数量
    - **status**: 按状态筛选（active/completed/archived）
    - **keyword**: 搜索关键词（匹配名称、编码、描述）
    """
    items, total = ProjectCRUD.get_list(
        db,
        skip=skip,
        limit=limit,
        status=status,
        keyword=keyword
    )

    # 添加统计信息
    result_items = []
    for item in items:
        response = ProjectResponse.model_validate(item)
        response.metric_count = ProjectCRUD.get_metric_count(db, item.id)
        response.achievement_rate = ProjectCRUD.get_achievement_rate(db, item.id)
        result_items.append(response)

    return {"total": total, "items": result_items}


@project_router.get("/{project_id}", response_model=ProjectResponse, summary="获取单个项目")
async def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """根据ID获取项目详情"""
    project = ProjectCRUD.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    response = ProjectResponse.model_validate(project)
    response.metric_count = ProjectCRUD.get_metric_count(db, project_id)
    response.achievement_rate = ProjectCRUD.get_achievement_rate(db, project_id)
    return response


@project_router.put("/{project_id}", response_model=ProjectResponse, summary="更新项目")
async def update_project(
    project_id: int,
    project: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """
    更新项目信息

    只需提供需要更新的字段
    """
    # 如果更新编码，检查是否重复
    if project.code:
        existing = ProjectCRUD.get_by_code(db, project.code)
        if existing and existing.id != project_id:
            raise HTTPException(status_code=400, detail=f"项目编码 '{project.code}' 已存在")

    updated = ProjectCRUD.update(db, project_id, project)
    if not updated:
        raise HTTPException(status_code=404, detail="项目不存在")

    response = ProjectResponse.model_validate(updated)
    response.metric_count = ProjectCRUD.get_metric_count(db, project_id)
    response.achievement_rate = ProjectCRUD.get_achievement_rate(db, project_id)
    return response


@project_router.delete("/{project_id}", summary="删除项目")
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """删除指定项目（级联删除关联的指标）"""
    success = ProjectCRUD.delete(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="项目不存在")
    return {"code": 200, "message": "删除成功"}


# ============ 项目指标 API ============

@project_router.post("/{project_id}/metrics", summary="添加指标到项目")
async def add_metric_to_project(
    project_id: int,
    metric_data: ProjectMetricCreate,
    db: Session = Depends(get_db)
):
    """
    添加指标到项目

    - **metric_id**: 指标ID
    - **target_value**: 该项目下的目标值（可覆盖原指标目标值）
    """
    # 检查项目是否存在
    project = ProjectCRUD.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    # 检查指标是否存在
    metric = MetricCRUD.get_by_id(db, metric_data.metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="指标不存在")

    result = ProjectCRUD.add_metric(db, project_id, metric_data.metric_id, metric_data.target_value)
    if not result:
        raise HTTPException(status_code=400, detail="该指标已存在于项目中")

    return {"code": 200, "message": "添加成功", "data": {"id": result.id}}


@project_router.delete("/{project_id}/metrics/{metric_id}", summary="从项目移除指标")
async def remove_metric_from_project(
    project_id: int,
    metric_id: int,
    db: Session = Depends(get_db)
):
    """从项目中移除指定指标"""
    success = ProjectCRUD.remove_metric(db, project_id, metric_id)
    if not success:
        raise HTTPException(status_code=404, detail="项目指标关联不存在")
    return {"code": 200, "message": "移除成功"}


@project_router.get("/{project_id}/metrics", summary="获取项目下所有指标")
async def get_project_metrics(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    获取项目下所有指标（含达成状态）

    返回每个指标的当前值、目标值、达成状态、趋势等信息
    """
    # 检查项目是否存在
    project = ProjectCRUD.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    metrics = ProjectCRUD.get_project_metrics(db, project_id)
    return {"code": 200, "message": "success", "data": metrics}


@project_router.get("/{project_id}/stats", response_model=ProjectStats, summary="获取项目统计")
async def get_project_stats(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    获取项目统计信息

    - **total_metrics**: 总指标数
    - **achieved_metrics**: 达标指标数
    - **achievement_rate**: 达成率（百分比）
    """
    # 检查项目是否存在
    project = ProjectCRUD.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    return ProjectCRUD.get_project_stats(db, project_id)
