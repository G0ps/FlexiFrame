# services/AExampleService/service.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import sys
import os
import uuid
import asyncio
import json
import websockets  # pip install websockets

from dotenv import load_dotenv
load_dotenv()

# Ensure current folder is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

app = FastAPI(title="main_service")

connected_clients = {}  # {client_id: websocket}


async def send_to_client(client_id: str, data: dict):
    websocket = connected_clients.get(client_id)
    if websocket:
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            print(f"Error sending to {client_id}: {e}")


# -----------------------------
# Communicate with helper per client
# -----------------------------
async def communicate_with_helper(client_id: str, message: str):
    uri = "ws://localhost:2000/ws/chat"  # helper WebSocket
    try:
        async with websockets.connect(uri) as websocket:
            # Send message to helper
            await websocket.send(json.dumps({"input": message}))
            
            # Wait for response from helper
            response = await websocket.recv()
            data_from_helper = json.loads(response)
            print(f"Helper response for {client_id}:", data_from_helper)
            
            try:
                dt_try = data_from_helper.get("input")
                print("Its json la : ")
                print(dt_try)
            except:
                pass


            # Forward helper response to the client
            await send_to_client(client_id, {
                "status": "success",
                "client_id": client_id,
                "response": "ui_update",
                "input": dt_try
            })
    except Exception as e:
        print(f"Error communicating with helper for {client_id}:", e)
        await send_to_client(client_id, {
            "status": "error",
            "client_id": client_id,
            "response": "helper_error",
            "input": str(e)
        })


# -----------------------------
# FastAPI WebSocket endpoint
# -----------------------------
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_id = str(uuid.uuid4())
    connected_clients[client_id] = websocket
    print(f"Client connected: {client_id}")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received from client {client_id}: {data}")

            # Create a dedicated task to communicate with helper for this client
            asyncio.create_task(communicate_with_helper(client_id, data))

    except WebSocketDisconnect:
        print(f"Client disconnected: {client_id}")
        del connected_clients[client_id]


# -----------------------------
# Entry point for launcher
# -----------------------------
if __name__ == "__main__":
    import uvicorn

    try:
        port_index = sys.argv.index("--port") + 1
        port = int(sys.argv[port_index])
    except (ValueError, IndexError):
        port = 1000

    uvicorn.run("service:app", host="0.0.0.0", port=port, reload=False)
