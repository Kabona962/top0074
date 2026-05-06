"""
냉장고 재료 기반 레시피 추천 (Ollama).

[처리 개요]
1) 저장소에 등록된 재료 목록을 자연어 나열 형태로 직렬화한다.
2) 이용자의 선호/제약(선택)을 같은 프롬프트에 포함한다.
3) LLM에게 "보유 재료만 전제로 한 요리"를 강제하는 시스템 지시를 부여해
   환각 재료 사용을 억제한다. (완전 보장은 아니며, UI에서 확인을 권장)
"""

from app.schemas import FridgeItemOut
from app.services.ollama_client import ollama_generate


async def suggest_recipes(items: list[FridgeItemOut], preferences: str | None) -> str:
    lines = []
    for it in items:
        q = it.quantity or ""
        e = it.expiry_note or ""
        lines.append(f"- {it.name} ({q})  메모:{e}")
    inv = "\n".join(lines) if lines else "(비어 있음 — 일반 한식 아이디어만 제시)"

    system = (
        "당신은 가정식 레시피 추천 도우미입니다. "
        "한국어로, 재료를 최대한 소진하는 방향을 우선합니다. "
        "없는 재료를 사용자가 가진 것처럼 말하지 마세요."
    )
    pref = preferences or "특별 제약 없음"
    prompt = f"""
냉장고 재료 목록:
{inv}

추가 선호/제약:
{pref}

아래 Markdown 형식으로 답하세요:
## 추천 1: (요리 이름)
- 준비 재료: ...
- 간단 순서: 1) ... 2) ...
- 팁: ...

## 추천 2: (요리 이름)
...

## 추천 3: (요리 이름)
...
""".strip()
    return await ollama_generate(prompt, system=system)
