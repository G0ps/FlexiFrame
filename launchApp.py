import subprocess
import sys
import os
import threading

env = os.environ.copy()
env["PYTHONPATH"] = os.path.abspath(os.path.dirname(__file__))

python_executable = r"D:\Projects\Dynamic-Ui\myenv\Scripts\python.exe"

services = [
    {"name": "AExampleService", "file": "services/AExampleService/service.py", "port": "8001"}
]

processes = []

def stream_output(pipe, service_name, pipe_type):
    """Read lines from pipe and print with service markers."""
    print(f"=============== {service_name} ({pipe_type}) ===============")
    for line in iter(pipe.readline, b''):
        line = line.decode().rstrip()
        if line:
            print(line)

    print(f"=============== END {service_name} ({pipe_type}) ===============")
try:
    for service in services:
        service_file = os.path.abspath(service["file"])
        service_dir = os.path.dirname(service_file)

        print(f"Starting {service['name']} on port {service['port']}...")
        p = subprocess.Popen(
            [python_executable, service_file, "--port", service["port"]],
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
