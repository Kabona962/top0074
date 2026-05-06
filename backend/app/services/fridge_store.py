"""냉장고 식재료 CRUD (SQLite)."""

import aiosqlite

from app.db import DB_PATH
from app.schemas import FridgeItemCreate, FridgeItemOut


async def list_items() -> list[FridgeItemOut]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT id, name, quantity, expiry_note FROM fridge_items ORDER BY id DESC"
        )
        rows = await cur.fetchall()
    return [FridgeItemOut(id=r["id"], name=r["name"], quantity=r["quantity"], expiry_note=r["expiry_note"]) for r in rows]


async def add_item(item: FridgeItemCreate) -> FridgeItemOut:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "INSERT INTO fridge_items (name, quantity, expiry_note) VALUES (?, ?, ?)",
            (item.name, item.quantity, item.expiry_note),
        )
        await db.commit()
        new_id = cur.lastrowid
    return FridgeItemOut(id=int(new_id), name=item.name, quantity=item.quantity, expiry_note=item.expiry_note)


async def delete_item(item_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("DELETE FROM fridge_items WHERE id = ?", (item_id,))
        await db.commit()
        return cur.rowcount > 0
