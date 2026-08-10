from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.room_file import (
    FileCreate,
    FileUpdate,
    FileRename
)

from app.services.room_file_service import (
    create_file,
    get_room_files,
    get_file,
    update_file,
    delete_file,
    rename_file
)

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)


@router.post("/create")
def create_new_file(
    data: FileCreate,
    db: Session = Depends(get_db)
):

    file = create_file(
        db,
        data.room_code,
        data.filename,
        data.language
    )

    if file is None:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    if file == "exists":
        raise HTTPException(
            status_code=400,
            detail="File already exists"
        )

    return file


@router.get("/{room_code}")
def list_room_files(
    room_code: str,
    db: Session = Depends(get_db)
):
    return get_room_files(
        db,
        room_code
    )


@router.get("/content/{file_id}")
def get_file_content(
    file_id: int,
    db: Session = Depends(get_db)
):

    file = get_file(
        db,
        file_id
    )

    if file is None:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return file


@router.put("/update/{file_id}")
def update_file_content(
    file_id: int,
    data: FileUpdate,
    db: Session = Depends(get_db)
):

    file = update_file(
        db,
        file_id,
        data.content
    )

    if file is None:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return file

@router.put("/rename/{file_id}")
def rename_existing_file(
    file_id: int,
    data: FileRename,
    db: Session = Depends(get_db)
):

    file = rename_file(
        db,
        file_id,
        data.filename
    )

    if file is None:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if file == "exists":
        raise HTTPException(
            status_code=400,
            detail="Filename already exists"
        )

    return file

@router.delete("/delete/{file_id}")
def remove_file(
    file_id: int,
    db: Session = Depends(get_db)
):

    deleted = delete_file(
        db,
        file_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return {
        "message": "File deleted successfully"
    }