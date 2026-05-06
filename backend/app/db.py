"""SQLite 초기화 및 연결 헬퍼."""

import aiosqlite

DB_PATH = "fridge.db"


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS fridge_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                quantity TEXT,
                expiry_note TEXT
            )
            """
        )
        await db.commit()
