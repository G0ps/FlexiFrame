from abc import ABC, abstractmethod
from google import genai
import os

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