from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_authority
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserResponse


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/",
    response_model=list[UserResponse],
    dependencies=[Depends(require_authority)],
)
def get_users(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(User).order_by(User.id)
    )

    return result.scalars().all()


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_own_profile(
    user: User = Depends(get_current_user),
):
    return user


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "authority" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to view this user",
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user
