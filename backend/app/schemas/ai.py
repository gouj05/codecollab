from pydantic import BaseModel


class ExplainRequest(BaseModel):

    language: str

    code: str


class ExplainResponse(BaseModel):

    explanation: str

class AIRequest(BaseModel):
    language: str
    code: str 

class GenerateRequest(BaseModel):
    language: str
    prompt: str


class GenerateResponse(BaseModel):
    code: str