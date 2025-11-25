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
    {"name": "service_llm", "file": "services/controller/service.py", "port": "1000"}
]

processes = []

def stream_output(pipe, service_name, pipe_type):
    print(f"=============== {service_name} ({pipe_type}) ===============")
    for line in iter(pipe.readline, b''):
        try:
            line = line.decode(errors="ignore").rstrip()
        except Exception:
            line = str(line)
        if line:
            print(line)
    print(f"=============== END {service_name} ({pipe_type}) ===============")
try:
    for service in services:
        service_file = os.path.abspath(service["file"])
        service_dir = os.path.dirname(service_file)

        print(f"Starting {service['name']} on port {service['port']}...")
        p = subprocess.Popen(
            [python_executable, "-u", service_file, "--port", service["port"]],
            env=env,
            cwd=service_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        threading.Thread(target=stream_output, args=(p.stdout, service['name'], 'stdout'), daemon=True).start()
        threading.Thread(target=stream_output, args=(p.stderr, service['name'], 'stderr'), daemon=True).start()
        processes.append(p)

    # Keep the launcher running
    for p in processes:
        p.wait()

except KeyboardInterrupt:
    print("Stopping all services...")
    for p in processes:
        p.terminate()
