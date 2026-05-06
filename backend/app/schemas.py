"""Pydantic 요청/응답 스키마."""

from datetime import date

from pydantic import BaseModel, Field


class PriceAnalyzeRequest(BaseModel):
    product_name: str = Field(..., min_length=1, description="조회할 농산물명 (예: 사과)")


class PriceAnalyzeResponse(BaseModel):
    product_name: str
    current_price: float
    unit: str
    data_source_note: str
    statistics_summary: str
    recommendation_markdown: str
    model_used: str


class FridgeItemCreate(BaseModel):
    name: str = Field(..., min_length=1)
    quantity: str | None = Field(default=None, description="예: 2개, 300g")
    expiry_note: str | None = Field(default=None, description="유통기한 메모")


class FridgeItemOut(BaseModel):
    id: int
    name: str
    quantity: str | None
    expiry_note: str | None


class RecipeSuggestRequest(BaseModel):
    preferences: str | None = Field(
        default=None,
        description="추가 선호 (예: 매운 거 싫어요, 한식 위주)",
    )


class RecipeSuggestResponse(BaseModel):
    recipe_markdown: str
    model_used: str


class FarmCalendarRequest(BaseModel):
    """농가 달력 조언 요청. target_date 미지정 시 서버 당일(UTC 아님 로컬) 기준."""

    target_date: date | None = Field(
        default=None,
        description="기준일(YYYY-MM-DD). 비우면 서버 날짜",
    )
    region: str | None = Field(
        default=None,
        description="시·도 또는 대략 지역 (예: 전라남도, 고랭지)",
    )
    farm_notes: str | None = Field(
        default=None,
        description="재배 작목, 노지/시설, 규모 등 메모",
    )


class FarmCalendarResponse(BaseModel):
    applied_date: str
    region: str | None
    advice_markdown: str
    model_used: str
