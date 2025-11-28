# tools/main_service.py
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import HTMLResponse
import uvicorn
import json
from dotenv import load_dotenv



# Load .env from parent directory
PARENT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = PARENT_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
    print(f"[INIT] Loaded environment from {ENV_PATH}")
else:
    print(f"[INIT] WARNING: .env not found at {ENV_PATH}")

app = FastAPI(title="Prompt Test Backend")

# CORS: allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def log_request(route: str, payload):
    print(f"[REQUEST] {route} payload: {payload}")

def log_response(response):
    print(f"[RESPONSE] {response}")
#======================================
# LLM CALLING SERVICE

from llm_service import GeminiService
API_KEY = "AIzaSyDDmqWjbJjZG-7_t2Kv01vxeRUXchfoVrc"
llm_service = GeminiService(api_key=API_KEY)
print("llm Service initialized.")

#======================================
#======================================
#text extraaction
from prompt_builder import concatenate_files
file_a = 'v1_python_dict.txt'
file_b = 'v1_schema.txt'
combined_data = concatenate_files(file_a, file_b)
print("Builded : ")
print(combined_data)
#======================================

#======================================
#json stripper
def strip_json_fence(text):
    """
    Remove ```json or ``` from start/end of LLM response if present.
    """
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()

#======================================


@app.post("/prompt")
async def receive_prompt(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    print("type : " ,type(data))
    prompt_text = data.get("prompt")
    log_request("/prompt [POST]", data)
    # Get raw response from LLM
    result = llm_service.get_response("USER REQUEST : " + prompt_text + combined_data)
    print("llm response:")
    print(result)
    print("===========================================================\nstripped\n")

    # Strip the ```json fence if it exists
    stripped = strip_json_fence(result)

    try:
        # Convert the JSON string into a Python dictionary
        static_response_dict = json.loads(stripped)
    except json.JSONDecodeError as e:
        # If parsing fails, return an error response
        print(f"JSON decode error: {e}")
        return JSONResponse(content={
            "success": "false",
            "error": "Failed to parse LLM response as JSON",
            "raw_response": result
        })

    # Convert back to string if needed
    static_response = json.dumps(static_response_dict)

    # Build final response
    response = {"success": "true", "data": static_response}

    # Log and return
    log_response(response)
    return JSONResponse(content=response)




HTML_FILE_PATH = "./frontend/UI/v4.html"  # <-- replace this with your HTML file path

@app.get("/")
async def root():
    log_request("/ [GET]", {})
    try:
        with open(HTML_FILE_PATH, "r", encoding="utf-8") as f:
            html_content = f.read()
        response = {"status": "success", "message": f"Serving {HTML_FILE_PATH}"}
        log_response(response)
        return HTMLResponse(content=html_content)
    except FileNotFoundError:
        response = {"status": "error", "message": f"File not found: {HTML_FILE_PATH}"}
        log_response(response)
        return JSONResponse(content=response, status_code=404)


if __name__ == "__main__":
    # Host/port from env with defaults
    host = os.getenv("PROMPT_HOST", "127.0.0.1")
    port = int(os.getenv("MAIN_SERVICE", "8000"))

    print(f"[SERVER] main_service running at http://{host}:{port}/prompt")

    uvicorn.run(
        "mock:app",
        host=host,
        port=port,
        reload=False,
        workers=1
    )
