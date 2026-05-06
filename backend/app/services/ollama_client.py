"""
Ollama HTTP API 클라이언트.

exaone3.5:2.4b 모델은 로컬 Ollama에 사전 pull 되어 있어야 합니다:
  ollama pull exaone3.5:2.4b
"""

import httpx

from app.config import settings


async def ollama_generate(prompt: str, system: str | None = None) -> str:
    """
    /api/generate 엔드포인트를 사용해 단일 응답 텍스트를 받습니다.
    스트리밍은 사용하지 않고 response 필드를 합칩니다.
    """
    payload: dict = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(f"{settings.ollama_base_url}/api/generate", json=payload)
        r.raise_for_status()
        data = r.json()
        return (data.get("response") or "").strip()
