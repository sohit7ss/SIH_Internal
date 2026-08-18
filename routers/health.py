from fastapi import APIRouter

router = APIRouter(
    tags=["testing"]
)

@router.get("/health")
def health():
    return {"status": "ok"}

@router.get("/lan-check")
def lan_check():
    return {
        "status": "ok",
        "service": "classroom-local-server",
        "on_lan": True
    }