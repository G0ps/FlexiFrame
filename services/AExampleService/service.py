# services/AExampleService/service.py
from fastapi import FastAPI
import sys
import os

# Ensure current folder is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

app = FastAPI(title="AExampleService")

@app.get("/")
async def home():
    return {"service": "AExampleService is running"}

# -----------------------------
# Entry point for launcher
# -----------------------------
if __name__ == "__main__":
    import uvicorn

    # Get port from command-line argument, default 8000
    try:
        port_index = sys.argv.index("--port") + 1
        port = int(sys.argv[port_index])
    except (ValueError, IndexError):
        port = 8000

    # uvicorn.run with the current file as module
    # Since launcher sets cwd=service_dir, we can use "service:app"
    uvicorn.run("service:app", host="0.0.0.0", port=port, reload=False)
