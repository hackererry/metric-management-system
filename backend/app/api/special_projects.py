"""
专项项目 API 路由（统一 POST）
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.special_project import SpecialProject
from app.schemas.special_project import (
    SpecialProjectCreate,
    SpecialProjectUpdate,
    SpecialProjectResponse,
    SpecialProjectListResponse,
    SpecialProjectTargetCreate,
    SpecialProjectTargetUpdate,
    SpecialProjectTargetResponse,
    SpecialProjectListRequest,
    SpecialProjectGetRequest,
    SpecialProjectDeleteRequest,
    SpecialProjectUpdateRequest,
    SpecialProjectBudgetUpdateRequest,
    SpecialProjectTargetCreateRequest,
    SpecialProjectTargetUpdateRequest,
    SpecialProjectTargetDeleteRequest,
    SpecialProjectTargetProgressRequest,
)
from app.crud.special_project import SpecialProjectCRUD, SpecialProjectTargetCRUD
from app.auth import get_ip_whitelist_manager, get_client_ip

router = APIRouter(prefix="/api/special-projects", tags=["专项项目管理"])


def check_ip_write_permission(request: Request) -> None:
    """校验IP写权限，如无权限则抛出HTTPException"""
    client_ip = get_client_ip(request)
    manager = get_ip_whitelist_manager()
    if not manager.is_whitelisted(client_ip):
        raise HTTPException(status_code=403, detail=f"IP {client_ip} 没有写权限")


def build_project_response(project: SpecialProject) -> SpecialProjectResponse:
    """构建项目响应，计算预算使用百分比"""
    budget_usage = 0
    if project.budget_person_days > 0:
        budget_usage = round((project.budget_used_days / project.budget_person_days) * 100, 1)

    response = SpecialProjectResponse.model_validate(project)
    response.budget_usage_percent = budget_usage
    return response


# ==================== 项目接口 ====================

@router.post("/create", response_model=SpecialProjectResponse, summary="创建专项项目")
async def create_project(
    project: SpecialProjectCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    创建新的专项项目

    - **sub_project**: 子项目名称
    - **responsible_person**: 责任人
    - **project_manager**: 项目经理
    - **budget_person_days**: 预算投入(人天)
    - **status**: 项目状态
    - **targets**: 目标列表（可选，支持多目标）
    """
    # IP写权限校验
    check_ip_write_permission(request)

    db_project = SpecialProjectCRUD.create(db, project)
    return build_project_response(db_project)


@router.post("/list", response_model=SpecialProjectListResponse, summary="获取专项项目列表")
async def get_projects(
    request: SpecialProjectListRequest,
    db: Session = Depends(get_db)
):
    """
    获取专项项目列表，支持分页和筛选

    - **skip**: 分页偏移量
    - **limit**: 每页数量
    - **status**: 按状态筛选（planning/in_progress/on_hold/completed/cancelled）
    - **keyword**: 搜索关键词（匹配子项目、责任人）
    """
    items, total = SpecialProjectCRUD.get_list(
        db,
        skip=request.skip,
        limit=request.limit,
        status=request.status,
        keyword=request.keyword
    )

    project_responses = [build_project_response(p) for p in items]

    return {"total": total, "items": project_responses}


@router.post("/get", response_model=SpecialProjectResponse, summary="获取单个专项项目")
async def get_project(
    request: SpecialProjectGetRequest,
    db: Session = Depends(get_db)
):
    """根据ID获取专项项目详情"""
    project = SpecialProjectCRUD.get_by_id(db, request.id)
    if not project:
        raise HTTPException(status_code=404, detail="专项项目不存在")

    return build_project_response(project)


@router.post("/update", response_model=SpecialProjectResponse, summary="更新专项项目")
async def update_project(
    request: SpecialProjectUpdateRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """
    更新专项项目信息

    只需提供需要更新的字段
    """
    # IP写权限校验
    check_ip_write_permission(http_request)

    # 构建 SpecialProjectUpdate 对象（排除 id）
    update_data = request.model_dump(exclude={'id'}, exclude_unset=True)
    project_update = SpecialProjectUpdate(**update_data)

    updated = SpecialProjectCRUD.update(db, request.id, project_update)
    if not updated:
        raise HTTPException(status_code=404, detail="专项项目不存在")

    return build_project_response(updated)


@router.post("/delete", summary="删除专项项目")
async def delete_project(
    request: SpecialProjectDeleteRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """删除指定专项项目（级联删除目标）"""
    # IP写权限校验
    check_ip_write_permission(http_request)

    success = SpecialProjectCRUD.delete(db, request.id)
    if not success:
        raise HTTPException(status_code=404, detail="专项项目不存在")
    return {"code": 200, "message": "删除成功"}


@router.post("/budget/update", response_model=SpecialProjectResponse, summary="更新预算使用")
async def update_budget_used(
    request: SpecialProjectBudgetUpdateRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """更新项目预算使用人天"""
    # IP写权限校验
    check_ip_write_permission(http_request)

    updated = SpecialProjectCRUD.update_budget_used(db, request.id, request.used_days)
    if not updated:
        raise HTTPException(status_code=404, detail="专项项目不存在")

    return build_project_response(updated)


# ==================== 目标接口 ====================

@router.post("/targets/create", response_model=SpecialProjectTargetResponse, summary="创建目标")
async def create_target(
    request: SpecialProjectTargetCreateRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """为专项项目创建新目标"""
    # IP写权限校验
    check_ip_write_permission(http_request)

    project = SpecialProjectCRUD.get_by_id(db, request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="专项项目不存在")

    target_create = SpecialProjectTargetCreate(
        target_name=request.target_name,
        target_value=request.target_value,
        current_value=request.current_value,
        unit=request.unit,
        weight=request.weight,
    )
    return SpecialProjectTargetCRUD.create(db, request.project_id, target_create)


@router.post("/targets/update", response_model=SpecialProjectTargetResponse, summary="更新目标")
async def update_target(
    request: SpecialProjectTargetUpdateRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """更新目标"""
    # IP写权限校验
    check_ip_write_permission(http_request)

    db_target = SpecialProjectTargetCRUD.get_by_id(db, request.target_id)
    if not db_target or db_target.project_id != request.project_id:
        raise HTTPException(status_code=404, detail="目标不存在")

    # 构建 TargetUpdate 对象（排除 project_id 和 target_id）
    update_data = request.model_dump(exclude={'project_id', 'target_id'}, exclude_unset=True)
    target_update = SpecialProjectTargetUpdate(**update_data)

    return SpecialProjectTargetCRUD.update(db, request.target_id, target_update)


@router.post("/targets/delete", summary="删除目标")
async def delete_target(
    request: SpecialProjectTargetDeleteRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """删除指定目标"""
    # IP写权限校验
    check_ip_write_permission(http_request)

    db_target = SpecialProjectTargetCRUD.get_by_id(db, request.target_id)
    if not db_target or db_target.project_id != request.project_id:
        raise HTTPException(status_code=404, detail="目标不存在")

    SpecialProjectTargetCRUD.delete(db, request.target_id)
    return {"code": 200, "message": "删除成功"}


@router.post("/targets/progress", response_model=SpecialProjectTargetResponse, summary="更新目标进度")
async def update_target_progress(
    request: SpecialProjectTargetProgressRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """更新目标当前值，自动计算达成率"""
    # IP写权限校验
    check_ip_write_permission(http_request)

    db_target = SpecialProjectTargetCRUD.get_by_id(db, request.target_id)
    if not db_target or db_target.project_id != request.project_id:
        raise HTTPException(status_code=404, detail="目标不存在")

    return SpecialProjectTargetCRUD.update_current_value(db, request.target_id, request.current_value)
