# services/AExampleService/service.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import json
import uuid
import requests
import io
from dotenv import load_dotenv

load_dotenv()

# Ensure system stdout uses UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# Ensure current folder is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

app = FastAPI(title="uiGenerator")

# ------------------------------------------------------
# CORS
# ------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# WebSocket client cache
# ------------------------------------------------------
connected_clients = {}

async def send_to_client(client_id: str, data: dict):
    websocket = connected_clients.get(client_id)
    if websocket:
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            print(f"Error sending to {client_id}: {e}")


# ------------------------------------------------------
# Prompt builder
# ------------------------------------------------------
from prompt_builder import UIPromptBuilder

def build_prompt(val: str):
    builder = UIPromptBuilder()
    return builder.build_prompt(val)


# ------------------------------------------------------
# MCP request
# ------------------------------------------------------
def get_data_from_mcp(user_input: str):
    MCP_URL = "http://localhost:1003/prompt"
    try:
        response = requests.post(MCP_URL, json={"prompt": user_input})
        response.raise_for_status()
        dt = response.json()
        print("Data returned from MCP (uiGenerator):", dt)
        return dt
    except requests.RequestException as e:
        print("Error contacting MCP:", str(e))
        return {"status": "error", "message": str(e)}


# ------------------------------------------------------
# LLM
# ------------------------------------------------------
from llm_test import GeminiLLM
llm = GeminiLLM()


# ------------------------------------------------------
# WebSocket endpoint
# ------------------------------------------------------
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    client_id = str(uuid.uuid4())
    connected_clients[client_id] = websocket
    print(f"Client connected: {client_id}")

    try:
        while True:
            user_input = await websocket.receive_text()
            print(f"Received input from {client_id}: {user_input}")

            # ------------------------------------------------------
            # MCP
            # ------------------------------------------------------
            mcp_data = get_data_from_mcp(user_input)
            json_mcp = json.dumps(mcp_data)

            # ------------------------------------------------------
            # Build prompt
            # ------------------------------------------------------
            built_prompt = build_prompt(user_input)
            final_prompt = f"{built_prompt}\nINPUT DATA FOR MAPPING:\n{json_mcp}"

            print("Final prompt to LLM:")
            print(final_prompt)

            # ------------------------------------------------------
            # LLM call
            # ------------------------------------------------------
            # If async:
            gemini_response = llm.send_llm(final_prompt)

            # If sync instead:
            # gemini_response = llm.send_llm(final_prompt)

            # ------------------------------------------------------
            # Send result to UI client
            # ------------------------------------------------------
            await send_to_client(client_id, {
                "status": "success",
                "client_id": client_id,
                "response": "ui_update",
                "input": gemini_response
            })

    except WebSocketDisconnect:
        print(f"Client disconnected: {client_id}")
        connected_clients.pop(client_id, None)


# ------------------------------------------------------
# Launcher
# ------------------------------------------------------
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
