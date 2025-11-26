# services/AExampleService/service.py
from fastapi import FastAPI
import sys
import os
from dotenv import load_dotenv
import json

load_dotenv()

# Ensure current folder is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import the unified handler
from prompt_handler import PromptHandler

app = FastAPI(title="main_service")

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
    prompt = payload.get("prompt")
    version = payload.get("version", "v1")

    if not prompt:
        return {
            "status": "error",
            "message": "Field 'prompt' is required"
        }

    handler = PromptHandler(version)
    result = handler.run(prompt)
    result_str = json.dumps(result, indent=4)
    response_text = llm.send_llm(result_str)
    print("Response you got : ")
    print( response_text )

    # print("Sabari's code response : ")
    datat_sab = get_val(json.loads(response_text) , fetch = True);
    # print(datat_sab);

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
        port = 1003

    uvicorn.run("service:app", host="0.0.0.0", port=port, reload=False)
