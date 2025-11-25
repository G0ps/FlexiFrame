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

app = FastAPI(title="modificcation")














# --------------------
# Helper to send JSON to a specific client
# --------------------
connected_clients = {} 
async def send_to_client(client_id: str, data: dict):
    websocket = connected_clients.get(client_id)
    if websocket:
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            print(f"Error sending to {client_id}: {e}")

# --------------------
# WebSocket endpoint
# --------------------
from llm_interface import GeminiLLM
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_id = str(uuid.uuid4())
    connected_clients[client_id] = websocket
    print(f"Client connected: {client_id}")

    llm = GeminiLLM()  # Instantiate LLM client

    try:
        while True:
            # Receive prompt from client
            prompt = await websocket.receive_text()
            print(f"Received from {client_id}: {prompt}")

            # Send prompt to Gemini LLM
            response_text = llm.send_llm(prompt)
            print(f"LLM response for {client_id}: {response_text}")

            # Send JSON response back to client
            await send_to_client(client_id, {
                "status": "success",
                "client_id": client_id,
                "response": response_text
            })

    except WebSocketDisconnect:
        print(f"Client disconnected: {client_id}")
        del connected_clients[client_id]






















if __name__ == "__main__":
    import uvicorn

    # Get port from command-line argument, default 8000
    try:
        port_index = sys.argv.index("--port") + 1
        port = int(sys.argv[port_index])
    except (ValueError, IndexError):
        port = 1001

    # uvicorn.run with the current file as module
    # Since launcher sets cwd=service_dir, we can use "service:app"
    uvicorn.run("service:app", host="0.0.0.0", port=port, reload=False)
