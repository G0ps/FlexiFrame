# tools/commentingTool.py
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv

# Load .env from parent directory
PARENT_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = PARENT_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
    print(f"[INIT] Loaded environment from {ENV_PATH}")
else:
    print(f"[INIT] WARNING: .env not found at {ENV_PATH}")

app = FastAPI(title="Commenting Test Backend")

# CORS: allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory comment storage
COMMENTS = {}
next_id = 1


def log_request(route: str, payload):
    print(f"[REQUEST] {route} payload: {payload}")


def log_response(response):
    print(f"[RESPONSE] {response}")


@app.get("/comments")
async def get_comments():
    log_request("/comments [GET]", {})
    response = {"status": "success", "comments": COMMENTS}
    log_response(response)
    return JSONResponse(content=response)


@app.post("/comments")
async def create_comment(request: Request):
    global next_id
    try:
        data = await request.json()
    except Exception:
        print("Excepted.... ")
        data = {}

    log_request("/comments [POST]", data)

    COMMENTS[next_id] = data
    response = {
        "status": "success",
        "created_id": next_id,
        "comment": data
    }
    next_id += 1

    log_response(response)
    return JSONResponse(content=response)



@app.put("/comments/{comment_id}")
async def update_comment_full(comment_id: int, request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    log_request(f"/comments/{comment_id} [PUT]", data)

    if comment_id not in COMMENTS:
        response = {"status": "error", "message": "ID not found"}
        log_response(response)
        return JSONResponse(content=response, status_code=404)

    COMMENTS[comment_id] = data

    response = {"status": "success", "updated": COMMENTS[comment_id]}
    log_response(response)
    return JSONResponse(content=response)


@app.patch("/comments/{comment_id}")
async def update_comment_partial(comment_id: int, request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    log_request(f"/comments/{comment_id} [PATCH]", data)

    if comment_id not in COMMENTS:
        response = {"status": "error", "message": "ID not found"}
        log_response(response)
        return JSONResponse(content=response, status_code=404)

    # Partial update
    COMMENTS[comment_id].update(data)

    response = {"status": "success", "updated": COMMENTS[comment_id]}
    log_response(response)
    return JSONResponse(content=response)


@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: int):
    log_request(f"/comments/{comment_id} [DELETE]", {})

    if comment_id not in COMMENTS:
        response = {"status": "error", "message": "ID not found"}
        log_response(response)
        return JSONResponse(content=response, status_code=404)

    deleted = COMMENTS.pop(comment_id)

    response = {"status": "success", "deleted": deleted}
    log_response(response)
    return JSONResponse(content=response)


if __name__ == "__main__":
    # Host/port from env with defaults
    host = os.getenv("COMMENT_HOST", "127.0.0.1")
    port = int(os.getenv("COMMENT_PORT", "10000"))

    print(f"[SERVER] CommentingTool running at http://{host}:{port}/comments")

    uvicorn.run(
        "commentingTool:app",
        host=host,
        port=port,
        reload=False,
        workers=1
    )
