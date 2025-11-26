# services/AExampleService/service.py
from fastapi import FastAPI
import sys
import os
import uuid
import asyncio
import json
import requests  # Used instead of websockets for REST calls
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

# Ensure current folder is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

app = FastAPI(title="main_service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# Communicate with helper (REST instead of WebSocket)
# =====================================================================
async def communicate_with_helper_rest(client_id: str, message: str):
    """
    This replaces the previous WebSocket helper call.
    Calls helper's REST endpoint: POST http://localhost:2000/chat
    """
    SERVICE_PORT = os.environ.get("UI_GENERATOR")
    url = f"http://localhost:{SERVICE_PORT}/chat"

    try:
        payload = {
            "message": message,
            "client_id": client_id
        }

        print(f"[main_service] Sending to helper REST: {payload}")

        response = requests.post(url, json=payload)
        response.raise_for_status()

        helper_data = response.json()
        print(f"[main_service] Helper REST response:", helper_data)

        # Extract the previous "input" field the same way WebSocket version did
        dt_try = helper_data.get("input")

        return {
            "status": "success",
            "client_id": client_id,
            "response": "ui_update",
            "input": dt_try
        }

    except Exception as e:
        print(f"Error communicating with helper for {client_id}: {e}")
        return {
            "status": "error",
            "client_id": client_id,
            "response": "helper_error",
            "input": str(e)
        }


# =====================================================================
# REST endpoint replacing WebSocket /ws/chat
# =====================================================================
@app.post("/chat")
async def chat_rest(payload: dict):
    """
    REST replacement for WebSocket messages.
    Expected:
    {
        "message": "text",
        "client_id": "optional"
    }
    """

    message = payload.get("message")
    client_id = payload.get("client_id") or str(uuid.uuid4())

    print(f"[main_service] Received REST message from {client_id}: {message}")

    # Spawn async helper task and wait
    task = asyncio.create_task(communicate_with_helper_rest(client_id, message))
    result = await task

    return result


# =====================================================================
# Entry point
# =====================================================================
if __name__ == "__main__":
    import uvicorn

    try:
        port_index = sys.argv.index("--port") + 1
        port = int(sys.argv[port_index])
    except (ValueError, IndexError):
        port = int(os.environ.get("MAIN_SERVICE_PORT")) 

    uvicorn.run("service:app", host="0.0.0.0", port=port, reload=False)
