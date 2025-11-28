from abc import ABC, abstractmethod
from google import genai


# --- Abstract Base Class (The Interface) ---

class LLMInterface(ABC):
    """
    Abstract base class defining the required interface for all LLM services.
    """

    @abstractmethod
    def get_response(self, prompt: str) -> str:
        """
        Generates a text response from the LLM based on the input prompt.

        Args:
            prompt: The string input/question for the LLM.

        Returns:
            A string containing only the generated text response.
        """
        pass

# --- Concrete Implementation (Gemini API) ---

class GeminiService(LLMInterface):
    """
    Concrete implementation of LLMInterface using the Google GenAI SDK (Gemini API).
    """

    def __init__(self, api_key: str, model_name: str = 'gemini-2.5-pro'):
        """
        Initializes the Gemini client.

        Args:
            api_key: Your Google AI API key.
            model_name: The specific Gemini model to use.
        """
        if not api_key:
            raise ValueError("API key cannot be empty.")
        
        # Configure the client using the provided API key
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name
        self._check_api_key()

    def _check_api_key(self):
        """
        Attempts a small call to verify the API key is valid, but prints a non-blocking warning on failure.
        """
        try:
            # Simple list operation to verify connection and key
            list(self.client.models.list())
        except Exception as e:
            # Catch other potential errors (e.g., network)
            print(f"Warning: An unexpected error occurred during API key check: {e}")

    def get_response(self, prompt: str) -> str:
        """
        Overrides the abstract method to call the Gemini API and return only text.

        Args:
            prompt: The string input/question for the LLM.

        Returns:
            A string containing only the generated text response.
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            # Return only the text part of the response object
            return response.text
        except Exception as e:
            # Handle other runtime errors
            return f"Error: An unexpected error occurred: {e}"