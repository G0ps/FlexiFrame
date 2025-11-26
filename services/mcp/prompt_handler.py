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
            You are an AI agent responsible for computing the correct tool-usage execution order based on two inputs:
            1.The available Tool Details "TOOL DETAILS"
            2.The User Prompt "USER PROMPT"
            Your output must be a STRICT JSON object that follows the exact structure defined in the STRICT OUTPUT SECTION.
            Your task is to analyze the user's request, determine which tools should be used, in what order, and with what parameters, and generate the required structured plan.

            Always prioritize the user's stated intent when determining tool-usage ordering.
            Do not include explanations, comments, or additional text. Produce only the JSON object that represents the final sequence of server actions.

        EXAMPLE INPUT STRUCTURE
        [
            {{
                "id": "todo",
                "method": "GET",
                "endpoint": "https://jsonplaceholder.typicode.com",
                "url_ext": "/todos/3",
                "outputAs": "output1"
            }},
            {{
                "id": "post",
                "group": "g1",
                "method": "GET",
                "endpoint": "https://jsonplaceholder.typicode.com",
                "url_ext": "/posts/4",
                "extract": {{
                "postId": "id"
                }},
                "outputAs": "output2.chain1"
            }},
            {{
                "id": "photos",
                "group": "g1",
                "method": "GET",
                "endpoint": "https://jsonplaceholder.typicode.com",
                "url_ext": "/albums/1/photos",
                "collect": "array",
                "outputAs": "output2.chain2"
            }}
            ]
            
        USER PROMPT : 
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
