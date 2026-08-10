from fastapi import APIRouter

from app.schemas.ai import (
    AIRequest,
    ExplainRequest,
    ExplainResponse,
    GenerateRequest,
    GenerateResponse
)

from app.services.ai_service import (
    explain_code,
    autocomplete,
    generate_code
)

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


# ==========================================================
# Explain Code
# ==========================================================

@router.post(
    "/explain",
    response_model=ExplainResponse
)
def explain(request: ExplainRequest):

    explanation = explain_code(
        request.language,
        request.code
    )

    return ExplainResponse(
        explanation=explanation
    )


# ==========================================================
# AI Autocomplete
# ==========================================================

@router.post("/autocomplete")
def autocomplete_route(request: AIRequest):

    completion = autocomplete(
        request.language,
        request.code
    )

    return {
        "completion": completion
    }


# ==========================================================
# Generate Code
# ==========================================================

@router.post(
    "/generate",
    response_model=GenerateResponse
)
def generate(request: GenerateRequest):

    code = generate_code(
        request.language,
        request.prompt
    )

    return GenerateResponse(
        code=code
    )