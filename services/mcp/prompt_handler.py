# prompt_handler.py
from abc import ABC, abstractmethod
from tool_parser import load_tool_details
import json

# --------------------------------------------------------
# Base class
# --------------------------------------------------------
class PromptHandlerBase(ABC):
    @abstractmethod
    def process(self, prompt: str) -> dict:
        pass


# --------------------------------------------------------
# Version 1 handler
# --------------------------------------------------------
class PromptHandlerV1(PromptHandlerBase):
    def process(self, prompt: str) -> dict:
        tool_details = load_tool_details()

        processed = f"""V1 processed:
            You are an expert API orchestration engineer.

            Your ONLY task is to convert any natural language request into a strictly valid JSON array that my custom HTTP batch runner can execute perfectly with zero changes.

            PRE-PROCESSING TASK :
            1. The user prompt will contain , ui requests as well . So make sure , the UI based requests are not considered, only data based aspects are considered by you.

            STRICT RULES — NEVER BREAK THESE:

            1. Output ONLY a raw JSON array. Nothing else. No explanations, no markdown, no extra text, no refusal.
            2. Every object = one HTTP request.
            3. Required fields:
            * "id" → unique short lowercase string (e.g. "post4", "user", "albums", "photos1")
            * "method" → "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
            * "endpoint" → full base URL (e.g. "https://jsonplaceholder.typicode.com")
            * "url_ext" → path after base (e.g. "/posts/4")
            * "outputAs" → where result goes (e.g. "data.post", "user.albums", "results.chain1")
            4. Use templating: {{steps.<id>.<path>}} → e.g. {{steps.post.userId}}
            5. Use "extract": {{ "key": "json.path" }} when needed
            6. Use "collect": "array" to keep full arrays
            7. Use "group": "anyName" for parallel execution
            8. Always use real, correct public API endpoints and paths
            9. Never use any markdown . completely avoid them and provide only textual output. require nothing other than text.
            10. The user will not provide all the variable names exactly but the model should not take it as. you must match and find the nearent match with the tools.

            EXAMPLE OUTPUT:

            [
            {{
                "id": "post",
                "method": "GET",
                "endpoint": "https://jsonplaceholder.typicode.com",
                "url_ext": "/posts/4",
                "extract": {{ "userId": "userId" }},
                "outputAs": "data.post"
            }},
            {{
                "id": "albums",
                "method": "GET",
                "endpoint": "https://jsonplaceholder.typicode.com",
                "url_ext": "/albums?userId={{steps.post.userId}}",
                "collect": "array",
                "outputAs": "data.albums"
            }}
            ]

            Now convert the user's request into exactly this format.
            USER PROMPT:
            {prompt}
            TOOL DETAILS:
            {json.dumps(tool_details)}
            """
        return {
            "version": "v1",
            "output": processed
        }


# --------------------------------------------------------
# Factory + Main Interface
# --------------------------------------------------------
class PromptHandler:
    def __init__(self, version: str = "v1"):
        self.version = version.lower()
        self.handler = self._factory(self.version)

    def _factory(self, version: str) -> PromptHandlerBase:
        if version == "v1":
            return PromptHandlerV1()
        # default fallback
        return PromptHandlerV1()

    def run(self, prompt: str) -> dict:
        return self.handler.process(prompt)
