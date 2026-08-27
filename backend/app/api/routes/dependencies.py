from app.services.dependency_graph import load_dependencies, build_graph
from app.services.ripple_analysis import analyze_impact
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.dependency import Dependency
from app.schemas.dependency import (
    DependencyCreate,
    DependencyResponse,
)
from app.services.dependency_graph import (
    load_dependencies,
    build_graph,
)

from app.services.ripple_analysis import analyze_impact


router = APIRouter(
    prefix="/dependencies",
    tags=["Dependencies"],
)


@router.post(
    "/",
    response_model=DependencyResponse,
    status_code=201,
)
def create_dependency(
    dependency: DependencyCreate,
    db: Session = Depends(get_db),
):
    dependency_data = Dependency(
        **dependency.model_dump()
    )

    db.add(dependency_data)
    db.commit()
    db.refresh(dependency_data)

    return dependency_data


@router.get(
    "/",
    response_model=list[DependencyResponse],
)
def get_dependencies(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Dependency)
        .order_by(Dependency.id)
    )

    return result.scalars().all()


@router.get(
    "/{source_type}/{source_id}",
    response_model=list[DependencyResponse],
)
def get_dependencies_for_source(
    source_type: str,
    source_id: int,
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Dependency)
        .where(
            Dependency.source_type == source_type,
            Dependency.source_id == source_id,
        )
        .order_by(Dependency.id)
    )

    return result.scalars().all()
@router.get(
    "/analysis/{source_type}/{source_id}",
)
def analyze_dependency_impact(
    source_type: str,
    source_id: int,
    db: Session = Depends(get_db),
):
    dependencies = load_dependencies(db)

    graph = build_graph(dependencies)

    disrupted_node = f"{source_type}:{source_id}"

    if disrupted_node not in graph:
        return {
            "error": "Node not found in dependency graph",
            "node": disrupted_node,
        }

    result = analyze_impact(
        graph,
        disrupted_node,
    )

    return result

@router.get(
    "/analysis/{source_type}/{source_id}",
)
def analyze_dependency_impact(
    source_type: str,
    source_id: int,
    db: Session = Depends(get_db),
):
    dependencies = load_dependencies(db)

    graph = build_graph(dependencies)

    disrupted_node = f"{source_type}:{source_id}"

    if disrupted_node not in graph:
        return {
            "error": "Node not found in dependency graph",
            "node": disrupted_node,
        }

    result = analyze_impact(
        graph,
        disrupted_node,
    )

    return result