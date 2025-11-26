# services/AExampleService/service.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import sys
import os
import json
import uuid

from dotenv import load_dotenv
load_dotenv()

# Ensure current folder is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

app = FastAPI(title="AExampleService")

# ---------------------------
# Import your BIG JSON UI
# ---------------------------
try:
    from tool_parser import load_tool_details
    big_ui_json_string = load_tool_details()
    print("UI JSON")
    print(big_ui_json_string)
except Exception as e:
    print("ERROR: Cannot import ui_json_big:", e)
    big_ui_json_string = '{"error": "UI JSON not loaded"}'


# ---------------------------
# Connected WebSocket Clients
# ---------------------------
connected_clients = {}

async def send_to_client(client_id: str, data: dict):
    websocket = connected_clients.get(client_id)
    if websocket:
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            print(f"Error sending to {client_id}: {e}")


# ---------------------------
# Dummy prompt builder (not used)
# ---------------------------

def build_prompt(val: str):
    return str

# ---------------------------
# WebSocket Endpoint
# ---------------------------


from llm_test import GeminiLLM
llm = GeminiLLM();
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    client_id = str(uuid.uuid4())
    connected_clients[client_id] = websocket
    print(f"Client connected: {client_id}")

    try:
        while True:
            user_input = await websocket.receive_text()
            print(f"Received from {client_id}: {user_input}")

            # Get prompt (unused)
            prompt = build_prompt(user_input)
            llm.send_llm()
            # SEND UI JSON TO FRONTEND
            await send_to_client(client_id, {
                "status": "success",
                "client_id": client_id,
                "response": "ui_update",
                "input": big_ui_json_string  # send entire UI JSON to React
            })

    except WebSocketDisconnect:
        print(f"Client disconnected: {client_id}")
        if client_id in connected_clients:
            del connected_clients[client_id]


# ---------------------------
# Launcher
# ---------------------------
if __name__ == "__main__":
    import uvicorn

    try:
        port_index = sys.argv.index("--port") + 1
        port = int(sys.argv[port_index])
    except (ValueError, IndexError):
        port = 2000

    uvicorn.run(
        "service:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )
