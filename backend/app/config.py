"""
환경 변수 및 애플리케이션 설정.

Ollama 기본 주소는 로컬 개발 시 http://127.0.0.1:11434 입니다.
공공데이터 API 키는 선택 사항이며, 없으면 데모용 시계열이 사용됩니다.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "exaone3.5:2.4b"
    cors_origins: str = "http://localhost:3000"

    # 선택: 한국 농수산물 유통공사(KAMIS) 등 가격 OpenAPI 키 (미설정 시 데모 데이터)
    kamis_api_key: str | None = None


settings = Settings()
