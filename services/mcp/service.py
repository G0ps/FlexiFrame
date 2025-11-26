# services/AExampleService/service.py
from fastapi import FastAPI
import sys
import os
from dotenv import load_dotenv
import json
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

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
