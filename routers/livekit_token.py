from fastapi import APIRouter
from livekit import api
import os

router = APIRouter(
    tags=["token"]
)

LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET")


@router.get("/livekit/token")
def get_livekit_token(room: str, identity: str):
    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
        .with_identity(identity) \
        .with_name(identity) \
        .with_grants(api.VideoGrants(room_join=True, room=room))
    return {"token": token.to_jwt()}