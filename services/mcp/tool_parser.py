import json
import os

def load_tool_details():
    file_path = os.path.join(os.path.dirname(__file__), "toolDetails.txt")
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Parse JSON text into Python dict
    data = json.loads(text)
    return data
