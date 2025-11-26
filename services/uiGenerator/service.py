# services/AExampleService/service.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import json
import uuid
import requests
from dotenv import load_dotenv

load_dotenv()

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
    MCP_PORT = os.environ.get("MCP_PORT", "1000")
    MCP_URL = f"http://localhost:{MCP_PORT}/prompt"
    try:
        response = requests.post(MCP_URL, json={"prompt": user_input})
        response.raise_for_status()
        dt = response.json()
        return dt
    except requests.RequestException as e:
        return {"status": "error", "message": str(e)}

# ------------------------------------------------------
# LLM
# ------------------------------------------------------
from llm_test import GeminiLLM
llm = GeminiLLM()

# ------------------------------------------------------
# REST API replacing WebSocket
# ------------------------------------------------------
@app.post("/chat")
async def chat_endpoint(payload: dict):
    """
    Input JSON:
    {
        "message": "<user_input>",
        "client_id": "<optional>"
    }
    """
    user_input = payload.get("message", "")
    client_id = payload.get("client_id") or str(uuid.uuid4())

    # MCP request
    mcp_data = get_data_from_mcp(user_input)
    json_mcp = json.dumps(mcp_data)

    # Build prompt
    built_prompt = build_prompt(user_input)
    final_prompt = f"{built_prompt}\nINPUT DATA FOR MAPPING:\n{json_mcp}"

    # LLM call
    gemini_response = llm.send_llm(final_prompt)

    # Return response
    return {
        "status": "success",
        "client_id": client_id,
        "response": "ui_update",
        "input": gemini_response
    }

# ------------------------------------------------------
# Launcher
# ------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    try:
        port_index = sys.argv.index("--port") + 1
        port = int(sys.argv[port_index])
    except (ValueError, IndexError):
        port = int(os.environ.get("UI_GENERATOR", 2000))

    uvicorn.run("service:app", host="0.0.0.0", port=port, reload=False)
