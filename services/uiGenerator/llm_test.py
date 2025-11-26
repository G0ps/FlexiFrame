from abc import ABC, abstractmethod
from google import genai
import os
import ollama
import json

# Abstract interface
class llm_interface(ABC):
    @abstractmethod
    def send_llm(self, prompt: str) -> str:
        """
        Abstract method to send a prompt to an LLM and return the response.
        """
        pass

# Concrete implementation using Google Gemini
class GeminiLLM(llm_interface):
    def __init__(self):
        gemini_api_key = os.environ.get("GEMINI_FLASH__API_KEY_1__modification_service")
        self.client = genai.Client(api_key=gemini_api_key)

    def send_llm(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text
    
# class OllamaLLM(llm_interface):
#     def __init__(self, model_name: str = "deepseek-r1:1.5b"):
#         self.model_name = model_name
#         self.client = ollama.Client()

#     def _safe_string(self, text: str) -> str:
#         # Encode using json.dumps() for safe escaping
#         safe = json.dumps(text)[1:-1]

#         # Apply your required transformations
#         safe = safe.replace("\n", "\\n")          # force "\n"
#         safe = safe.replace("{", "{{").replace("}", "}}")  # double braces

#         return safe

#     def send_llm(self, prompt: str) -> str:
#         response = self.client.generate(
#             model=self.model_name,
#             prompt=prompt
#         )

#         # Extract the raw text from the Ollama response
#         raw_text = response.get("response", "")  # safe default
        
#         # Return fully sanitized string
#         return self._safe_string(raw_text)  # text contains the model's output


