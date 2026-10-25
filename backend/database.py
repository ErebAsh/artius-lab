"""
SQLite database module for Artius Lab.
Uses aiosqlite for async operations with FastAPI.
"""

import contextlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import aiosqlite  # type: ignore[import-untyped]
from cryptography.fernet import Fernet
from dotenv import find_dotenv, load_dotenv

# Load from unified root .env or local .env
_env_path = find_dotenv(usecwd=True) or str(Path(__file__).resolve().parent.parent / ".env")
load_dotenv(_env_path)

# ── Encryption Configuration ──────────────────────────────────────
# You must set ENCRYPTION_MASTER_KEY in your .env
_CRYPTO_KEY = os.getenv("ENCRYPTION_MASTER_KEY")
_fernet = Fernet(_CRYPTO_KEY.encode()) if _CRYPTO_KEY else None


def encrypt_data(data: str | None) -> str | None:
    """Encrypt a string using the master key."""
    if not data or not _fernet:
        return data
    return _fernet.encrypt(data.encode()).decode()


def decrypt_data(data: str | None) -> str | None:
    """Decrypt a string using the master key."""
    if not data or not _fernet:
        return data
    try:
        return _fernet.decrypt(data.encode()).decode()
    except Exception:
        # If decryption fails (e.g. key changed or data wasn't encrypted), return original
        return data


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
                gemini_api_key  TEXT DEFAULT NULL,
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
        with contextlib.suppress(Exception):
            await db.execute(
                "ALTER TABLE resumes ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE"
            )

        # ── Add groq_api_key / gemini_api_key column if missing (migration for existing DBs) ──
        with contextlib.suppress(Exception):
            await db.execute("ALTER TABLE users ADD COLUMN groq_api_key TEXT DEFAULT NULL")
        with contextlib.suppress(Exception):
            await db.execute("ALTER TABLE users ADD COLUMN gemini_api_key TEXT DEFAULT NULL")
        with contextlib.suppress(Exception):
            await db.execute("ALTER TABLE users ADD COLUMN contact_no TEXT DEFAULT NULL")
        with contextlib.suppress(Exception):
            await db.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT NULL")
        with contextlib.suppress(Exception):
            await db.execute("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'")

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

        # ── User settings (UI preferences, etc.) ────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id         INTEGER PRIMARY KEY,
                settings_json   TEXT NOT NULL,
                updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        await db.commit()
        print(f"[DB] Database initialized at: {DB_PATH}")


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


async def list_resumes(
    limit: int = 50, offset: int = 0, user_id: int | None = None
) -> list[dict[str, Any]]:
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


async def save_ats_check(
    score: int, result_data: dict[str, Any], resume_id: int | None = None
) -> int:
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


async def create_user(
    email: str,
    password_hash: str,
    full_name: str = "",
    contact_no: str | None = None,
    avatar_url: str | None = None,
    auth_provider: str = "local",
    groq_api_key: str | None = None,
    gemini_api_key: str | None = None,
) -> int:
    """Create a new user. Returns the new user ID."""
    api_key = (
        (groq_api_key and groq_api_key.strip())
        or (gemini_api_key and gemini_api_key.strip())
        or None
    )
    encrypted_key = encrypt_data(api_key)
    db = await aiosqlite.connect(DB_PATH)
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """
            INSERT INTO users (email, password_hash, full_name, contact_no, avatar_url, auth_provider, gemini_api_key, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                email.lower().strip(),
                password_hash,
                full_name.strip(),
                contact_no.strip() if contact_no else None,
                avatar_url,
                auth_provider,
                encrypted_key,
                now,
                now,
            ),
        )
        await db.commit()
        row_id: int = cursor.lastrowid  # type: ignore[assignment]
        return row_id
    finally:
        await db.close()


async def get_or_create_oauth_user(
    email: str,
    full_name: str = "",
    avatar_url: str | None = None,
    contact_no: str | None = None,
    auth_provider: str = "google",
) -> dict[str, Any]:
    """Find existing user by email or create a new user from OAuth provider."""
    user = await get_user_by_email(email)
    if user:
        # Update details if new ones provided
        db = await aiosqlite.connect(DB_PATH)
        try:
            updates = []
            params = []
            if full_name and not user.get("full_name"):
                updates.append("full_name = ?")
                params.append(full_name.strip())
            if avatar_url and not user.get("avatar_url"):
                updates.append("avatar_url = ?")
                params.append(avatar_url)
            if contact_no and not user.get("contact_no"):
                updates.append("contact_no = ?")
                params.append(contact_no.strip())
            if updates:
                updates.append("updated_at = ?")
                params.append(datetime.now(timezone.utc).isoformat())
                params.append(user["id"])
                await db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
                await db.commit()
        finally:
            await db.close()
        return await get_user_by_email(email) or user

    # Create new OAuth user
    user_id = await create_user(
        email=email,
        password_hash="",  # No password for OAuth users
        full_name=full_name,
        contact_no=contact_no,
        avatar_url=avatar_url,
        auth_provider=auth_provider,
    )
    created_user = await get_user_by_id(user_id)
    if not created_user:
        raise RuntimeError("Failed to create OAuth user")
    return created_user


async def get_user_by_email(email: str) -> dict[str, Any] | None:
    """Find a user by email address."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
        row = await cursor.fetchone()
        if row is None:
            return None
        row_dict = dict(row)
        decrypted_key = decrypt_data(row_dict.get("gemini_api_key"))
        return {
            "id": row_dict["id"],
            "email": row_dict["email"],
            "password_hash": row_dict.get("password_hash", ""),
            "full_name": row_dict.get("full_name", ""),
            "contact_no": row_dict.get("contact_no"),
            "avatar_url": row_dict.get("avatar_url"),
            "auth_provider": row_dict.get("auth_provider", "local"),
            "groq_api_key": decrypted_key,
            "gemini_api_key": decrypted_key,
            "api_key": decrypted_key,
            "created_at": row_dict.get("created_at"),
            "updated_at": row_dict.get("updated_at"),
        }
    finally:
        await db.close()


async def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    """Find a user by ID."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = await cursor.fetchone()
        if row is None:
            return None
        row_dict = dict(row)
        decrypted_key = decrypt_data(row_dict.get("gemini_api_key"))
        return {
            "id": row_dict["id"],
            "email": row_dict["email"],
            "full_name": row_dict.get("full_name", ""),
            "contact_no": row_dict.get("contact_no"),
            "avatar_url": row_dict.get("avatar_url"),
            "auth_provider": row_dict.get("auth_provider", "local"),
            "groq_api_key": decrypted_key,
            "gemini_api_key": decrypted_key,
            "api_key": decrypted_key,
            "created_at": row_dict.get("created_at"),
            "updated_at": row_dict.get("updated_at"),
        }
    finally:
        await db.close()


async def get_user_auth_by_id(user_id: int) -> dict[str, Any] | None:
    """Find a user by ID including password_hash for authentication/password verification."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = await cursor.fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        await db.close()


async def update_user_profile(
    user_id: int,
    full_name: str,
    contact_no: str | None = None,
) -> bool:
    """Update a user's full name and contact number."""
    db = await aiosqlite.connect(DB_PATH)
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            "UPDATE users SET full_name = ?, contact_no = ?, updated_at = ? WHERE id = ?",
            (full_name.strip(), contact_no.strip() if contact_no else None, now, user_id),
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


async def update_user_password(
    user_id: int,
    new_password_hash: str,
) -> bool:
    """Update a user's password hash."""
    db = await aiosqlite.connect(DB_PATH)
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            (new_password_hash, now, user_id),
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


async def update_user_api_key(user_id: int, api_key: str | None) -> bool:
    """Update a user's Groq API key."""
    db = await aiosqlite.connect(DB_PATH)
    try:
        now = datetime.now(timezone.utc).isoformat()
        encrypted_val = encrypt_data(api_key) if api_key and api_key.strip() else None
        cursor = await db.execute(
            "UPDATE users SET gemini_api_key = ?, updated_at = ? WHERE id = ?",
            (encrypted_val, now, user_id),
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


# ═══════════════════════════════════════════════════════════════════
#  USER SETTINGS
# ═══════════════════════════════════════════════════════════════════


async def save_user_settings(user_id: int, settings_dict: dict[str, Any]) -> bool:
    """Save user UI settings. Upserts if they already exist."""
    db = await aiosqlite.connect(DB_PATH)
    try:
        now = datetime.now(timezone.utc).isoformat()
        await db.execute(
            """
            INSERT INTO user_settings (user_id, settings_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                settings_json = excluded.settings_json,
                updated_at = excluded.updated_at
            """,
            (user_id, json.dumps(settings_dict), now),
        )
        await db.commit()
    finally:
        await db.close()
    return True


async def get_user_settings(user_id: int) -> dict[str, Any] | None:
    """Fetch user-specific UI settings."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute(
            "SELECT settings_json FROM user_settings WHERE user_id = ?", (user_id,)
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return json.loads(row["settings_json"])
    finally:
        await db.close()
