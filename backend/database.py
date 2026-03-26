"""
SQLite database module for Artius Lab.
Uses aiosqlite for async operations with FastAPI.
"""

import os
import aiosqlite  # type: ignore[import-untyped]
import json
from datetime import datetime, timezone
from typing import Any

DB_PATH = os.path.join(os.path.dirname(__file__), "artius.db")


async def get_db() -> aiosqlite.Connection:
    """Get an async database connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db() -> None:
    """Initialize the database schema. Called on app startup."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")

        # ── Users table ────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                email           TEXT NOT NULL UNIQUE,
                password_hash   TEXT NOT NULL,
                full_name       TEXT NOT NULL DEFAULT '',
                created_at      TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Resumes table ──────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS resumes (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         INTEGER,
                title           TEXT NOT NULL DEFAULT 'Untitled Resume',
                template_id     TEXT NOT NULL DEFAULT 'classic',
                resume_data     TEXT NOT NULL,
                layout_settings TEXT,
                preview_html    TEXT,
                created_at      TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # ── Add user_id column if missing (migration for existing DBs) ──
        try:
            await db.execute("ALTER TABLE resumes ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE")
        except Exception:
            pass  # Column already exists

        # ── ATS Checks history ─────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS ats_checks (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                resume_id   INTEGER,
                score       INTEGER NOT NULL DEFAULT 0,
                result_data TEXT NOT NULL,
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
            )
        """)

        # ── AI enhancement history ─────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS enhancement_logs (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                resume_id       INTEGER,
                original_data   TEXT NOT NULL,
                enhanced_data   TEXT NOT NULL,
                created_at      TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
            )
        """)

        await db.commit()
        print(f"✅ Database initialized at: {DB_PATH}")


# ═══════════════════════════════════════════════════════════════════
#  RESUME CRUD
# ═══════════════════════════════════════════════════════════════════

async def save_resume(
    title: str,
    template_id: str,
    resume_data: dict[str, Any],
    layout_settings: dict[str, Any] | None = None,
    preview_html: str | None = None,
    user_id: int | None = None,
) -> int:
    """Save a new resume draft. Returns the new resume ID."""
    db = await aiosqlite.connect(DB_PATH)
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """
            INSERT INTO resumes (user_id, title, template_id, resume_data, layout_settings, preview_html, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                title,
                template_id,
                json.dumps(resume_data),
                json.dumps(layout_settings) if layout_settings else None,
                preview_html,
                now,
                now,
            ),
        )
        await db.commit()
        row_id: int = cursor.lastrowid  # type: ignore[assignment]
        return row_id
    finally:
        await db.close()


async def update_resume(
    resume_id: int,
    title: str | None = None,
    template_id: str | None = None,
    resume_data: dict[str, Any] | None = None,
    layout_settings: dict[str, Any] | None = None,
    preview_html: str | None = None,
) -> bool:
    """Update an existing resume. Returns True if a row was updated."""
    fields: list[str] = []
    values: list[Any] = []

    if title is not None:
        fields.append("title = ?")
        values.append(title)
    if template_id is not None:
        fields.append("template_id = ?")
        values.append(template_id)
    if resume_data is not None:
        fields.append("resume_data = ?")
        values.append(json.dumps(resume_data))
    if layout_settings is not None:
        fields.append("layout_settings = ?")
        values.append(json.dumps(layout_settings))
    if preview_html is not None:
        fields.append("preview_html = ?")
        values.append(preview_html)

    if not fields:
        return False

    fields.append("updated_at = ?")
    values.append(datetime.now(timezone.utc).isoformat())
    values.append(resume_id)

    db = await aiosqlite.connect(DB_PATH)
    try:
        cursor = await db.execute(
            f"UPDATE resumes SET {', '.join(fields)} WHERE id = ?",
            values,
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


async def get_resume(resume_id: int) -> dict[str, Any] | None:
    """Fetch a single resume by ID."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM resumes WHERE id = ?", (resume_id,))
        row = await cursor.fetchone()
        if row is None:
            return None
        return _row_to_resume(row)
    finally:
        await db.close()


async def list_resumes(limit: int = 50, offset: int = 0, user_id: int | None = None) -> list[dict[str, Any]]:
    """List saved resumes, newest first. Optionally filter by user_id."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        if user_id is not None:
            cursor = await db.execute(
                "SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?",
                (user_id, limit, offset),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM resumes ORDER BY updated_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            )
        rows = await cursor.fetchall()
        return [_row_to_resume(row) for row in rows]
    finally:
        await db.close()


async def delete_resume(resume_id: int) -> bool:
    """Delete a resume. Returns True if deleted."""
    db = await aiosqlite.connect(DB_PATH)
    try:
        cursor = await db.execute("DELETE FROM resumes WHERE id = ?", (resume_id,))
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


def _row_to_resume(row: Any) -> dict[str, Any]:
    """Convert a DB row to a clean resume dict."""
    return {
        "id": row["id"],
        "title": row["title"],
        "template_id": row["template_id"],
        "resume_data": json.loads(row["resume_data"]),
        "layout_settings": json.loads(row["layout_settings"]) if row["layout_settings"] else None,
        "preview_html": row["preview_html"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


# ═══════════════════════════════════════════════════════════════════
#  ATS CHECK HISTORY
# ═══════════════════════════════════════════════════════════════════

async def save_ats_check(score: int, result_data: dict[str, Any], resume_id: int | None = None) -> int:
    """Save an ATS check result. Returns the new check ID."""
    db = await aiosqlite.connect(DB_PATH)
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """
            INSERT INTO ats_checks (resume_id, score, result_data, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (resume_id, score, json.dumps(result_data), now),
        )
        await db.commit()
        row_id: int = cursor.lastrowid  # type: ignore[assignment]
        return row_id
    finally:
        await db.close()


async def list_ats_checks(limit: int = 20) -> list[dict[str, Any]]:
    """List recent ATS check results."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute(
            "SELECT * FROM ats_checks ORDER BY created_at DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "resume_id": row["resume_id"],
                "score": row["score"],
                "result_data": json.loads(row["result_data"]),
                "created_at": row["created_at"],
            }
            for row in rows
        ]
    finally:
        await db.close()


# ═══════════════════════════════════════════════════════════════════
#  ENHANCEMENT LOG
# ═══════════════════════════════════════════════════════════════════

async def save_enhancement_log(
    original_data: dict[str, Any], enhanced_data: dict[str, Any], resume_id: int | None = None
) -> int:
    """Log an AI enhancement operation."""
    db = await aiosqlite.connect(DB_PATH)
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """
            INSERT INTO enhancement_logs (resume_id, original_data, enhanced_data, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (resume_id, json.dumps(original_data), json.dumps(enhanced_data), now),
        )
        await db.commit()
        row_id: int = cursor.lastrowid  # type: ignore[assignment]
        return row_id
    finally:
        await db.close()


# ═══════════════════════════════════════════════════════════════════
#  USER CRUD
# ═══════════════════════════════════════════════════════════════════

async def create_user(email: str, password_hash: str, full_name: str = "") -> int:
    """Create a new user. Returns the new user ID."""
    db = await aiosqlite.connect(DB_PATH)
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """
            INSERT INTO users (email, password_hash, full_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (email.lower().strip(), password_hash, full_name.strip(), now, now),
        )
        await db.commit()
        row_id: int = cursor.lastrowid  # type: ignore[assignment]
        return row_id
    finally:
        await db.close()


async def get_user_by_email(email: str) -> dict[str, Any] | None:
    """Find a user by email address."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute(
            "SELECT * FROM users WHERE email = ?", (email.lower().strip(),)
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return {
            "id": row["id"],
            "email": row["email"],
            "password_hash": row["password_hash"],
            "full_name": row["full_name"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
    finally:
        await db.close()


async def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    """Find a user by ID."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute(
            "SELECT id, email, full_name, created_at, updated_at FROM users WHERE id = ?",
            (user_id,),
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return {
            "id": row["id"],
            "email": row["email"],
            "full_name": row["full_name"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
    finally:
        await db.close()
