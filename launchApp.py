import subprocess
import sys
import os
import threading

from dotenv import load_dotenv
load_dotenv()

env = os.environ.copy()
env["PYTHONPATH"] = os.path.abspath(os.path.dirname(__file__))

python_executable = r"D:\Projects\Dynamic-Ui\myenv\Scripts\python.exe"

services = [
    {"name": "controller", "file": "services/controller/service.py", "port": f"{os.environ.get("MAIN_SERVICE_PORT")}"},
    {"name": "mcp", "file": "services/mcp/service.py", "port": f"{os.environ.get("MCP_PORT")}"},
    {"name": "uiGenerator", "file": "services/uiGenerator/service.py", "port": f"{os.environ.get("UI_GENERATOR")}"},
    {"name" : "logger" , "file" : "services/logger/logger.py" , "port" : f"{os.environ.get("LOGGER_PORT")}"}
]

processes = []

def noop_stream(pipe, *_):
    # Do nothing; placeholder for stdout/stderr
    for _ in iter(pipe.readline, b''):
        pass

try:
    for service in services:
        service_file = os.path.abspath(service["file"])
        service_dir = os.path.dirname(service_file)

        p = subprocess.Popen(
            [python_executable, "-u", service_file, "--port", service["port"]],
            env=env,
            cwd=service_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # Start dummy threads to consume stdout/stderr without printing
        threading.Thread(target=noop_stream, args=(p.stdout,), daemon=True).start()
        threading.Thread(target=noop_stream, args=(p.stderr,), daemon=True).start()
        processes.append(p)

    # Keep the launcher running
    for p in processes:
        p.wait()

except KeyboardInterrupt:
    for p in processes:
        p.terminate()
