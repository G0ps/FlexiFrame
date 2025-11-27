from abc import ABC, abstractmethod
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uuid
import asyncio
import json

app = FastAPI(title="LoggerService")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Connected clients storage
# -----------------------------
connected_clients = {}  # {client_id: websocket}

@app.websocket("/ws/logger")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_id = str(uuid.uuid4())
    connected_clients[client_id] = websocket

    print(f"Client connected: {client_id}")

    try:
        while True:
            raw = await websocket.receive_text()

            print("\n📥 Received from client:", raw)

            # try to parse message as JSON
            try:
                data = json.loads(raw)
                message = data.get("message", raw)
                log_type = data.get("type", "data")
                port = data.get("port", "unknown")
            except:
                # plain text fallback
                message = raw
                log_type = "data"
                port = "unknown"

            # Call LoggerManager
            if log_type == "error":
                await logger_manager.log_error(message, port)
            else:
                await logger_manager.log_data(message, port)

    except WebSocketDisconnect:
        print(f"Client disconnected: {client_id}")
        connected_clients.pop(client_id, None)


# -----------------------------
# Broadcast to all connected clients
# -----------------------------
async def broadcast(message: dict):
    for client_id, ws in list(connected_clients.items()):
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            connected_clients.pop(client_id, None)


# ===========================
# Logger Interface
# ===========================
class LoggerInterface(ABC):
    @abstractmethod
    async def log_error(self, message: str, service_port: str):
        pass

    @abstractmethod
    async def log_data(self, message: str, service_port: str):
        pass


# ===========================
# Terminal Logger
# ===========================
class TerminalLogger(LoggerInterface):
    async def log_error(self, message: str, service_port: str):
        payload = {
            "type": "terminal_error",
            "port": service_port,
            "message": message
        }
        print("Logg_received : \n")
        print(message)
        await broadcast(payload)

    async def log_data(self, message: str, service_port: str):
        payload = {
            "type": "terminal_data",
            "port": service_port,
            "message": message
        }
        print("error_received : \n")
        print(message)
        await broadcast(payload)


# ===========================
# UI Logger (example extension)
# ===========================
class UILogger(LoggerInterface):
    async def log_error(self, message: str, service_port: str):
        payload = {
            "type": "ui_error",
            "port": service_port,
            "message": message
        }
        print("Logg_received : \n")
        print(message)
        await broadcast(payload)

    async def log_data(self, message: str, service_port: str):
        payload = {
            "type": "ui_data",
            "port": service_port,
            "message": message
        }
        print("error_received : \n")
        print(message)
        await broadcast(payload)


# ===========================
# Logger Manager (calls all)
# ===========================
class LoggerManager:
    def __init__(self):
        # Add all logger implementations here
        self.loggers = [TerminalLogger(), UILogger()]

    async def log_error(self, message: str, service_port: str):
        await asyncio.gather(*[logger.log_error(message, service_port) for logger in self.loggers])

    async def log_data(self, message: str, service_port: str):
        await asyncio.gather(*[logger.log_data(message, service_port) for logger in self.loggers])


# Singleton instance
logger_manager = LoggerManager()


# ===========================
# Start FastAPI logger service
# ===========================
def start_logger_service(port: int = 4000):
    import uvicorn
    uvicorn.run("logger:app", host="0.0.0.0", port=port, reload=False)


if __name__ == "__main__":
    print("Starting LoggerService on port 4000...")
    start_logger_service(4000)
