"""
指标管理 API 路由（统一 POST）
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Metric
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
    AggregationConfigCreate,
    AggregationConfigResponse,
    AggregationConfigDeleteRequest,
    AggregationComputeRequest,
    MetricCreateWithAggregation,
    SourceMetricOption,
)
from app.crud import MetricCRUD, MetricHistoryCRUD, AggregationCRUD

router = APIRouter(prefix="/api/metrics", tags=["指标管理"])

# 有效的分类列表
VALID_CATEGORIES = ['overview', 'product_a', 'product_b', 'product_c', 'product_d']


@router.post("/create", response_model=MetricResponse, summary="创建指标")
async def create_metric(
    metric: MetricCreateWithAggregation,
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
    - **source_configs**: 来源指标配置（仅 overview 指标支持，可选）
    """
    # 检查编码是否已存在
    existing = MetricCRUD.get_by_code(db, metric.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"指标编码 '{metric.code}' 已存在")

    # 如果是 overview 指标且有 source_configs，验证配置的有效性
    source_configs = metric.source_configs or []
    if metric.category.value == 'overview' and source_configs:
        # 验证所有源指标都存在且为子产品类别
        for cfg in source_configs:
            source_metric = MetricCRUD.get_by_id(db, cfg.source_metric_id)
            if not source_metric:
                raise HTTPException(status_code=400, detail=f"源指标ID {cfg.source_metric_id} 不存在")
            if source_metric.category == 'overview':
                raise HTTPException(status_code=400, detail="源指标不能是 overview 类别")

    # 创建指标
    db_metric = MetricCRUD.create(db, metric)

    # 如果有聚合配置，创建它们
    for cfg in source_configs:
        config_data = AggregationConfigCreate(
            target_metric_id=db_metric.id,
            source_metric_id=cfg.source_metric_id,
            aggregation_type=cfg.aggregation_type,
            weight=cfg.weight
        )
        AggregationCRUD.create(db, config_data)

    return db_metric


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

    # 获取现有的指标
    existing_metric = MetricCRUD.get_by_id(db, request.id)
    if not existing_metric:
        raise HTTPException(status_code=404, detail="指标不存在")

    # 处理聚合配置更新（仅当明确传递了 source_configs 字段时）
    if request.source_configs is not None and existing_metric.category == 'overview':
        # 验证所有源指标都存在且为子产品类别
        for cfg in request.source_configs:
            source_metric = MetricCRUD.get_by_id(db, cfg.source_metric_id)
            if not source_metric:
                raise HTTPException(status_code=400, detail=f"源指标ID {cfg.source_metric_id} 不存在")
            if source_metric.category == 'overview':
                raise HTTPException(status_code=400, detail="源指标不能是 overview 类别")

        # 删除旧的聚合配置
        old_configs = AggregationCRUD.get_configs_by_target(db, request.id)
        for cfg in old_configs:
            AggregationCRUD.delete(db, cfg.id)

        # 创建新的聚合配置（仅当有配置时才创建）
        if request.source_configs:
            for cfg in request.source_configs:
                config_data = AggregationConfigCreate(
                    target_metric_id=request.id,
                    source_metric_id=cfg.source_metric_id,
                    aggregation_type=cfg.aggregation_type,
                    weight=cfg.weight
                )
                AggregationCRUD.create(db, config_data)

    # 构建 MetricUpdate 对象（排除 id 和 source_configs）
    update_data = request.model_dump(exclude={'id', 'source_configs'}, exclude_unset=True)
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


# ============ 聚合配置 API ============

@router.post("/aggregation/source-options", summary="获取可选的源指标列表")
async def get_source_metric_options(
    dimension: Optional[str] = Query(None, description="按维度筛选"),
    db: Session = Depends(get_db)
):
    """
    获取可作为源指标的子产品指标列表

    - **dimension**: 可选，按维度筛选（如 quality/efficiency/experience/business/operation）
    """
    # 获取所有子产品类别的活跃指标
    sub_categories = ['product_a', 'product_b', 'product_c', 'product_d']
    query = db.query(Metric).filter(
        Metric.category.in_(sub_categories),
        Metric.is_active == True
    )

    if dimension:
        query = query.filter(Metric.dimension == dimension)

    metrics = query.all()
    return [SourceMetricOption(
        id=m.id,
        name=m.name,
        code=m.code,
        category=m.category,
        dimension=m.dimension,
        lower_is_better=m.lower_is_better,
        unit=m.unit,
        data_type=m.data_type
    ) for m in metrics]


@router.post("/aggregation/config/create", response_model=AggregationConfigResponse, summary="创建聚合配置")
async def create_aggregation_config(
    config: AggregationConfigCreate,
    db: Session = Depends(get_db)
):
    """
    创建指标聚合配置

    定义子产品指标如何聚合到产品部指标
    - **target_metric_id**: 目标指标ID（产品部/overview类别）
    - **source_metric_id**: 源指标ID（子产品类别）
    - **aggregation_type**: 聚合方式（sum/average）
    - **weight**: 权重（默认为1.0）
    """
    # 检查目标指标是否存在且为overview类别
    target_metric = MetricCRUD.get_by_id(db, config.target_metric_id)
    if not target_metric:
        raise HTTPException(status_code=404, detail="目标指标不存在")
    if target_metric.category != 'overview':
        raise HTTPException(status_code=400, detail="目标指标必须是overview类别")

    # 检查源指标是否存在且为子产品类别
    source_metric = MetricCRUD.get_by_id(db, config.source_metric_id)
    if not source_metric:
        raise HTTPException(status_code=404, detail="源指标不存在")
    if source_metric.category == 'overview':
        raise HTTPException(status_code=400, detail="源指标不能是overview类别")

    return AggregationCRUD.create(db, config)


@router.post("/aggregation/config/list", summary="获取聚合配置列表")
async def list_aggregation_configs(
    target_metric_id: Optional[int] = Query(None, description="按目标指标ID筛选"),
    db: Session = Depends(get_db)
):
    """
    获取聚合配置列表

    - **target_metric_id**: 可选，按目标指标ID筛选
    """
    if target_metric_id:
        configs = AggregationCRUD.get_configs_by_target(db, target_metric_id)
    else:
        configs = AggregationCRUD.get_all(db)

    # 转换为包含指标详情的响应
    result = []
    for cfg in configs:
        target = MetricCRUD.get_by_id(db, cfg.target_metric_id)
        source = MetricCRUD.get_by_id(db, cfg.source_metric_id)
        result.append({
            "id": cfg.id,
            "target_metric_id": cfg.target_metric_id,
            "source_metric_id": cfg.source_metric_id,
            "aggregation_type": cfg.aggregation_type,
            "weight": cfg.weight,
            "target_metric": {"id": target.id, "name": target.name, "code": target.code, "category": target.category} if target else None,
            "source_metric": {"id": source.id, "name": source.name, "code": source.code, "category": source.category} if source else None,
        })
    return {"code": 200, "message": "success", "data": result}


@router.post("/aggregation/config/delete", summary="删除聚合配置")
async def delete_aggregation_config(
    request: AggregationConfigDeleteRequest,
    db: Session = Depends(get_db)
):
    """删除指定的聚合配置"""
    success = AggregationCRUD.delete(db, request.id)
    if not success:
        raise HTTPException(status_code=404, detail="聚合配置不存在")
    return {"code": 200, "message": "删除成功"}


@router.post("/aggregation/compute", summary="计算聚合值")
async def compute_aggregated_value(
    request: AggregationComputeRequest,
    db: Session = Depends(get_db)
):
    """
    计算指定目标指标的聚合值

    - **metric_id**: 目标指标ID
    """
    value = AggregationCRUD.compute_aggregated_value(db, request.metric_id)
    if value is None:
        raise HTTPException(status_code=404, detail="指标不存在或没有配置聚合关系")
    return {"code": 200, "message": "success", "data": {"value": value}}


@router.post("/aggregation/recompute", summary="重新计算所有聚合指标")
async def recompute_all_aggregations(
    db: Session = Depends(get_db)
):
    """
    重新计算所有聚合指标的值

    通常在批量数据修正后使用
    """
    count = AggregationCRUD.recompute_all(db)
    return {"code": 200, "message": f"成功重新计算 {count} 个聚合指标"}
