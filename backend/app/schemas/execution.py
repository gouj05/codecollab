from pydantic import BaseModel


class ExecuteRequest(BaseModel):

    language: str
    code: str