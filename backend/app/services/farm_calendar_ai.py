"""
농가 달력 AI 조언 모듈.

서버 또는 클라이언트가 지정한 '기준일'을 프롬프트에 고정 삽입해, 계절·월에 맞는
파종/정식 시기, 재배 관리 포인트, 이 시기에 주의할 병해충(일반론) 안내를 생성한다.

주의: 농약 사용·품목별 방제는 법규·등록 품목·지역 농업기술센터 지도를 따를 것.
본 출력은 참고용 자연어 요약이며 농업 경영·방제의 최종 판단을 대체하지 않는다.
"""

from datetime import date

from app.services.ollama_client import ollama_generate


def _season_label_kr(d: date) -> str:
    """간단한 계절 라벨 (한반도 기준 대략 구분, 프롬프트 맥락용)."""
    m = d.month
    if m in (12, 1, 2):
        return "겨울"
    if m in (3, 4, 5):
        return "봄"
    if m in (6, 7, 8):
        return "여름"
    return "가을"


async def generate_farm_calendar_advice(
    target: date,
    region: str | None,
    farm_notes: str | None,
) -> str:
    """
    기준일·지역·농가 메모를 바탕으로 Ollama에 농가 달력형 조언을 요청한다.
    """
    region_txt = region.strip() if region and region.strip() else "미지정(한국 일반 기후 가정)"
    notes_txt = farm_notes.strip() if farm_notes and farm_notes.strip() else "없음"
    season = _season_label_kr(target)

    system = (
        "당신은 한국 농가를 위한 '농가 달력' 안내 도우미입니다. "
        "주어진 기준일(연·월·일)과 계절을 반드시 존중해, 그 시기에 맞는 작업을 제안하세요. "
        "병해충·방제는 일반적 주의 대상을 예시 수준으로만 말하고, "
        "구체 농약 명칭·농도·처리 횟수 같은 '처방' 형태로 단정하지 마세요. "
        "불확실하면 지역 농업기술센터·품목별 표준 재배 매뉴얼 확인을 권하세요."
    )
    prompt = f"""
[기준일(절대 고정)] {target.isoformat()} (계절 맥락: {season})
[지역] {region_txt}
[농가 메모(작목·재배 형태 등)] {notes_txt}

아래 Markdown 형식으로 답하세요.

## 이번 시기에 고려할 파종·정식·관리
- 노지/시설/텃밭 등 메모에 맞춰 3~6개 불릿

## 주의할 병·해충(일반)
- 이 시기·작물에 흔한 예시를 3~5개 (증상·관찰 포인트 위주, 방제는 원칙만)

## 다음 2~3주 체크리스트
- 짧은 실무 체크 항목

## 면책·확인처
- 지역 기상·품목별로 차이가 있음, 농업기술센터·농사로 앱 등을 함께 보라는 한 문단
""".strip()

    return await ollama_generate(prompt, system=system)
