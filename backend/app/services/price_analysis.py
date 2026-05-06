"""
================================================================================
농산물 가격 예측·구매 시점 안내 파이프라인 (발명 설명용 상세 주석)
================================================================================

[기술 분야]
본 모듈은 공공·준공공 농산물 가격 데이터를 수집·정규화하고, 통계적 지표를
추출한 뒤, 대규모 언어 모델(LLM)을 "설명 가능한 조언 생성기"로 연계하여
이용자에게 "지금 구매할지 여부"에 대한 참고 정보를 제공하는 서비스 로직에 해당한다.

[해결하려는 과제]
- 단순 시세 조회만으로는 이용자가 의사결정(구매 타이밍)을 내리기 어렵다.
- 가격 시계열의 추세·변동성·최근 가격 위치(평균 대비) 등을 사람이 매번 해석하기엔 부담이 크다.

[발명의 구성(실시예 관점에서의 모듈 분해)]
1) 데이터 취득 계층 (Data Acquisition)
   - 공공데이터포털(data.go.kr) 등에 개방된 농산물 가격 API에서 시계열을 수신한다.
   - 본 실시예에서는 API 키 미설정 시에도 동작 검증이 가능하도록, 동일한 처리 파이프라인을
     통과하는 "데모 시계열"을 생성한다. (실서비스에서는 아래 fetch 함수의 실 API 호출부만 교체)

2) 전처리·정규화 계층 (Preprocessing)
   - 결측·이상치는 단순 실시예로 선형 보간 또는 제거 정책을 적용할 수 있다.
   - 본 코드는 데모 데이터가 깨끗하다는 가정 하에 최소 처리만 수행한다.

3) 특징 추출 계층 (Feature Engineering)  ※ 특허 명세서에서 "분석 모듈"로 기재 가능
   - 최근 N일 단순 이동평균(SMA)과의 괴리
   - 최근 구간 대비 변동성(표준편차)
   - 단기 추세(선형 회귀 기울기에 대한 부호)
   등을 계산하여 "수치 근거 벡터"를 만든다.

4) 설명 조건화 언어 생성 계층 (LLM-conditioned Explanation)
   - 위 수치 근거와 최신 시세를 프롬프트에 구조화하여 삽입한다.
   - LLM은 수치를 "발명된 사실"로 취급하지 않고, 입력으로 주어진 통계 요약에 **조건화**되어
     자연어 권고안을 생성한다. (환각을 줄이기 위해 통계 요약 문자열을 명시적으로 인용 형태로 넣음)

5) 안전·면책 계층 (Disclaimer / Human-in-the-loop)
   - 출력은 투자·영업·의료 등 법적 효력이 있는 자문이 아님을 고지한다.
   - 실제 구매 결정은 이용자의 판단과 시장 상황에 따른다.

[주의]
- "예측(prediction)"이라는 용어는 서비스 마케팅 용어로 쓰일 수 있으나, 본 실시예의 LLM 단계는
  통계 모델의 점예측값을 생성하는 것이 아니라, **이미 계산된 통계량을 바탕으로 한 해석·설명**에 가깝다.
  (명세서에서는 원하는 청구항 범위에 맞게 용어를 정리할 것)

================================================================================
"""

from __future__ import annotations

import hashlib
import json
import math
import statistics
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

import httpx

from app.config import settings
from app.services.ollama_client import ollama_generate


# -----------------------------------------------------------------------------
# 1) 데이터 취득 계층
# -----------------------------------------------------------------------------


@dataclass
class PricePoint:
    """단일 일자 관측치 (발명: 정규화된 시계열 원자 단위)."""

    day: date
    price: float  # 도매/소매 등 단위는 데이터 소스 메타와 함께 관리하는 것이 바람직함


def _stable_seed(s: str) -> int:
    """제품명 기반 결정론적 시드 (데모 시계열 재현성)."""
    h = hashlib.sha256(s.encode("utf-8")).hexdigest()
    return int(h[:8], 16)


def _demo_series(product_name: str, days: int = 30) -> list[PricePoint]:
    """
    데모용 가격 시계열 생성.

    실제 운영 시에는 이 함수 대신 공공 API에서 동일한 list[PricePoint]를 채우면 된다.
    """
    seed = _stable_seed(product_name)
    rnd = seed % 10000 / 10000.0
    base = 3000 + (seed % 5000)  # 원 단위 가정 (데모)
    out: list[PricePoint] = []
    prev = float(base)
    for i in range(days):
        d = date.today() - timedelta(days=(days - 1 - i))
        # 간단한 평균 회귀 + 잡음 (데모)
        noise = math.sin(i / 3.0 + rnd) * 120 + ((seed >> (i % 8)) & 0x7F) - 64
        prev = max(500.0, prev * 0.92 + 0.08 * base + noise * 0.05)
        out.append(PricePoint(day=d, price=round(prev, 2)))
    return out


async def fetch_price_series_public(product_name: str) -> tuple[list[PricePoint], str]:
    """
    공공데이터 기반 시계열 수신.

    실시예 확장 포인트(특허 실시예 변형):
    - KAMIS/농림축산식품부/지자체 개방 API의 엔드포인트·파라미터(품목코드, 시장코드, 일자)를 매핑 테이블로 관리
    - 응답 JSON의 필드명 차이를 어댑터 패턴으로 흡수

    현재 코드는 settings.kamis_api_key 가 있을 때 1회 시도 후, 실패 시 데모로 폴백한다.
    (data.go.kr에서 발급받은 실제 URL로 교체하세요.)
    """
    if settings.kamis_api_key:
        try:
            # 아래 URL은 예시 플레이스홀더입니다. 실제 서비스는 기관에서 제공하는 확정 URL로 교체합니다.
            params = {
                "serviceKey": settings.kamis_api_key,
                "itemName": product_name,
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                r = await client.get("https://apis.data.go.kr/PLACEHOLDER/kamis/dailyPrice", params=params)
                if r.status_code == 200:
                    data: Any = r.json()
                    # 실제 파싱 로직은 응답 스키마에 맞게 구현
                    if isinstance(data, dict) and data.get("items"):
                        parsed: list[PricePoint] = []
                        return parsed, "공공데이터 API (실연동 시)"
        except Exception:
            pass

    series = _demo_series(product_name)
    note = (
        "데모 시계열(로컬 생성). "
        "공공데이터를 쓰려면 backend/.env 에 KAMIS/공공 API 키를 설정하고 "
        "fetch_price_series_public()의 URL·파싱을 실제 스펙에 맞게 완성하세요."
    )
    return series, note


# -----------------------------------------------------------------------------
# 2)~3) 특징 추출 (분석 모듈)
# -----------------------------------------------------------------------------


def _linear_slope(y: list[float]) -> float:
    """단순 최소제곱 기울기 (추세 부호 판별용). x는 0..n-1 균등 간격 가정."""
    n = len(y)
    if n < 2:
        return 0.0
    x_mean = (n - 1) / 2.0
    y_mean = statistics.fmean(y)
    num = sum((i - x_mean) * (y[i] - y_mean) for i in range(n))
    den = sum((i - x_mean) ** 2 for i in range(n)) or 1.0
    return num / den


def build_analysis_bundle(series: list[PricePoint]) -> dict[str, Any]:
    """
    통계 근거 번들 생성.

    이 번들은 LLM 프롬프트에 JSON 직렬화 형태로 삽입되어, 생성 텍스트가
    "입력 통계에 조건화"되도록 한다.
    """
    prices = [p.price for p in series]
    last = prices[-1]
    window = min(7, len(prices))
    recent = prices[-window:]
    sma7 = statistics.fmean(recent)
    vol = statistics.pstdev(recent) if len(recent) > 1 else 0.0
    slope = _linear_slope(prices[-min(14, len(prices)) :])
    rel_to_sma = (last - sma7) / sma7 if sma7 else 0.0

    return {
        "latest_price": last,
        "sma_short": sma7,
        "relative_to_sma": rel_to_sma,
        "short_volatility": vol,
        "trend_slope_14d_proxy": slope,
        "observation_days": len(prices),
    }


def format_statistics_for_human(bundle: dict[str, Any]) -> str:
    """사람이 읽기 쉬운 근거 요약 (프롬프트 겸 UI 표시용)."""
    return (
        f"최근 관측일 수: {bundle['observation_days']}일\n"
        f"최신 가격: {bundle['latest_price']:.2f}\n"
        f"단기(최대 7일) 평균 대비: {bundle['relative_to_sma'] * 100:+.2f}%\n"
        f"단기 변동성(표준편차): {bundle['short_volatility']:.2f}\n"
        f"최근 구간 추세(기울기 지표, 양수=상승 경향): {bundle['trend_slope_14d_proxy']:.4f}"
    )


# -----------------------------------------------------------------------------
# 4) LLM 조건화 설명 생성
# -----------------------------------------------------------------------------


async def generate_buy_timing_advice(product_name: str, bundle: dict[str, Any]) -> str:
    """
    구매 시점 참고 의견 생성.

    청구항 작성 시 강조할 수 있는 점:
    - 입력으로 구조화된 통계 번들(JSON)을 강제하여, 모델 출력이 통계와 모순되기 어렵게 유도
    - 출력 형식(섹션 헤더)을 고정하여 UI/로그 파싱 용이
    """
    stats_json = json.dumps(bundle, ensure_ascii=False)
    system = (
        "당신은 한국어로 농산물 가격 정보를 해석해 구매 타이밍 '참고'를 주는 도우미입니다. "
        "법적 자문이나 확정적 투자 조언이 아닙니다. "
        "반드시 입력으로 주어진 통계 수치를 근거로 말하고, 없는 수치를 만들지 마세요."
    )
    prompt = f"""
품목: {product_name}

[분석기가 계산한 통계 번들(JSON)]
{stats_json}

아래 형식으로 답하세요:
## 한줄 결론
(지금 사기 좋은 편 / 관망 / 가격 변동이 커서 신중히 — 중 하나를 선택하고 이유를 한 문장)

## 근거
(위 JSON의 키 이름을 언급하며 2~4문장)

## 행동 제안
(실제로 장 볼 때 확인할 체크리스트 3개)

## 면책
(이 내용은 참고 정보이며 최종 결정은 본인 책임임을 짧게)
""".strip()
    return await ollama_generate(prompt, system=system)


async def analyze_product_for_user(product_name: str) -> tuple[float, str, str, str, str]:
    """
    엔드포인트에서 호출하는 퍼사드.

    Returns:
        (current_price, unit_label, data_note, stats_text, markdown_advice)
    """
    series, note = await fetch_price_series_public(product_name)
    bundle = build_analysis_bundle(series)
    stats_text = format_statistics_for_human(bundle)
    advice_md = await generate_buy_timing_advice(product_name, bundle)
    unit = "원/kg(데모 단위)"  # 실연동 시 API 메타데이터에서 단위를 가져오도록 변경
    return bundle["latest_price"], unit, note, stats_text, advice_md
