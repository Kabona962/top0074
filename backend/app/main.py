"""
FastAPI 진입점: 가격 분석, 냉장고/레시피, 농가 달력 API
"""

from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.schemas import (
    FarmCalendarRequest,
    FarmCalendarResponse,
    FridgeItemCreate,
    FridgeItemOut,
    PriceAnalyzeRequest,
    PriceAnalyzeResponse,
    RecipeSuggestRequest,
    RecipeSuggestResponse,
)
from app.services.farm_calendar_ai import generate_farm_calendar_advice
from app.services.fridge_store import add_item, delete_item, list_items
from app.services.price_analysis import analyze_product_for_user
from app.services.recipe_ai import suggest_recipes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="FarmKitchen API", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/price/analyze", response_model=PriceAnalyzeResponse)
async def price_analyze(body: PriceAnalyzeRequest):
    try:
        price, unit, note, stats, advice = await analyze_product_for_user(body.product_name.strip())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"분석 또는 AI 호출 실패: {e}") from e
    return PriceAnalyzeResponse(
        product_name=body.product_name.strip(),
        current_price=price,
        unit=unit,
        data_source_note=note,
        statistics_summary=stats,
        recommendation_markdown=advice,
        model_used=settings.ollama_model,
    )


@app.get("/api/fridge/items", response_model=list[FridgeItemOut])
async def fridge_list():
    return await list_items()


@app.post("/api/fridge/items", response_model=FridgeItemOut)
async def fridge_add(item: FridgeItemCreate):
    return await add_item(item)


@app.delete("/api/fridge/items/{item_id}")
async def fridge_remove(item_id: int):
    ok = await delete_item(item_id)
    if not ok:
        raise HTTPException(status_code=404, detail="항목 없음")
    return {"ok": True}


@app.post("/api/recipes/suggest", response_model=RecipeSuggestResponse)
async def recipes_suggest(body: RecipeSuggestRequest):
    items = await list_items()
    try:
        md = await suggest_recipes(items, body.preferences)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"레시피 생성 실패: {e}") from e
    return RecipeSuggestResponse(recipe_markdown=md, model_used=settings.ollama_model)


@app.post("/api/farm-calendar/advice", response_model=FarmCalendarResponse)
async def farm_calendar_advice(body: FarmCalendarRequest):
    """
    기준일(미입력 시 서버 로컬 오늘)에 맞춰 파종·관리·병해충 주의를 AI가 정리한다.
    """
    applied = body.target_date or date.today()
    try:
        md = await generate_farm_calendar_advice(applied, body.region, body.farm_notes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"농가 달력 생성 실패: {e}") from e
    return FarmCalendarResponse(
        applied_date=applied.isoformat(),
        region=body.region.strip() if body.region and body.region.strip() else None,
        advice_markdown=md,
        model_used=settings.ollama_model,
    )
