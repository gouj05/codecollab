from fastapi import APIRouter

from app.schemas.execution import ExecuteRequest

from app.execution.runner import run_code

router = APIRouter(
    prefix="/execute",
    tags=["Execution"]
)


@router.post("/run")
def execute_code(request: ExecuteRequest):

    return run_code(

        request.language,

        request.code

    )