from typing import Optional, List
from langchain_core.language_models import LLM
import requests


class GeminiLLM(LLM):
    api_key: str
    model: str = "gemini-2.5-flash"
    temperature: float = 0.7
    max_tokens: int = 8192

    @property
    def _llm_type(self) -> str:
        return "gemini"

    def __call__(self, prompt: str, stop=None, **kwargs):
        return self._call(prompt, stop=stop, **kwargs)

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager=None,
        **kwargs,
    ) -> str:

        # ✅ API key MUST be in query param for v1
        url = (
            f"https://generativelanguage.googleapis.com/v1/"
            f"models/{self.model}:generateContent"
            f"?key={self.api_key}"
        )

        headers = {
            "Content-Type": "application/json"
        }

        request_body = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": self.max_tokens,
                "topP": 0.95,
                "topK": 40
            }
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                json=request_body,
                timeout=60
            )

            response.raise_for_status()
            result = response.json()

            return (
                result["candidates"][0]
                ["content"]["parts"][0]["text"]
                .strip()
            )

        except requests.exceptions.HTTPError as e:
            return f"HTTP Error {response.status_code}: {response.text}"
        except requests.exceptions.Timeout:
            return "Error: Gemini API request timed out"
        except Exception as e:
            return f"Unexpected error: {str(e)}"
