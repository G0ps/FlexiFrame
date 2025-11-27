# services/AExampleService/service.py
from fastapi import FastAPI,WebSocket, WebSocketDisconnect
import sys
import os
import asyncio
import websockets
from dotenv import load_dotenv
import json
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
# ====================================================LOGGER==========================================================
logger_socket = None
logger_lock = asyncio.Lock()  # to prevent duplicate connects

async def connect_logger():
    """
    Connect once and store the websocket globally.
    Safe to call multiple times (locks prevent duplicate connections).
    """
    global logger_socket

    async with logger_lock:
        if logger_socket is not None:
            return logger_socket

        LOGGER_PORT = os.environ.get("LOGGER_PORT", "4000")
        uri = f"ws://localhost:{LOGGER_PORT}/ws/logger"

        logger_socket = await websockets.connect(uri)
        await logger_socket.send("MCP SERVER CONNECTED")
    return logger_socket


async def log(message: str):
    """Send a message using the global logger."""
    global logger_socket

    if logger_socket is None:
        print("Logger did not confugured...")
        await connect_logger()   # auto-connect if not already connected

    try:
        logger_socket.send(message)
    except:
        # try reconnecting once
        print("Error while logging....")


# ====================================================LOGGER==========================================================

# Ensure current folder is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import the unified handler
from prompt_handler import PromptHandler

app = FastAPI(title="mcp")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from llm_test import GeminiLLM;
llm = GeminiLLM()
from command_order_processor import get_val

@app.post("/prompt")
async def handle_prompt(payload: dict):
    """
    Expected JSON:
    {
        "prompt": "your text",
        "version": "v1"   # optional
    }
    """

    print("Payload received on mcp from ui Gen")
    print(payload)
    log(f"payload from mcp : " , json.dumps(payload))
    prompt = payload.get("prompt")
    version = payload.get("version", "v1")

    if not prompt:
        return {
            "status": "error",
            "message": "Field 'prompt' is required"
        }

    handler = PromptHandler(version)
    print("Prompt in mcp before loads : ")
    print(prompt)
    # input_prompt = json.loads(prompt)

    result = handler.run(prompt)
    result_str = json.dumps(result, indent=4)

    print("prompt sent to llm , on a go from mcp : ")
    print(result_str)
    
    response_text = llm.send_llm(result_str)
    print("Response you got : ")
    print(response_text)

    print("Sabari's code response : ")
    datat_sab = get_val(json.loads(response_text), fetch=True)
    print(datat_sab)

    return {
        "status": "success",
        "data": datat_sab
    }


# -------------------------------------
# Entry point for launcher
# -------------------------------------
if __name__ == "__main__":
    import uvicorn

    try:
        port_index = sys.argv.index("--port") + 1
        port = int(sys.argv[port_index])
    except (ValueError, IndexError):
        port = int(os.environ.get("MCP_PORT"))

    uvicorn.run("service:app", host="0.0.0.0", port=port, reload=False)
