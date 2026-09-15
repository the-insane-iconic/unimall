"""
UniMall Backend — Database Manager (backend/db.py)
SQLite database connection, WAL mode, foreign keys, transaction helpers.
"""

import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), 'unimall.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')


def get_connection():
    """Create and configure a SQLite connection."""
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db():
    """Initialize the database schema from schema.sql."""
    with open(SCHEMA_PATH, 'r') as f:
        schema_sql = f.read()

    conn = get_connection()
    try:
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()


@contextmanager
def transaction(immediate=True):
    """
    Context manager for database transactions.
    When immediate=True (default), acquires an immediate write lock (BEGIN IMMEDIATE)
    to safely prevent race conditions in inventory updates.
    """
    conn = get_connection()
    try:
        if immediate:
            conn.execute("BEGIN IMMEDIATE")
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def query_all(query, args=(), conn=None):
    """Execute a SELECT query and return list of dicts."""
    close_after = False
    if conn is None:
        conn = get_connection()
        close_after = True
    try:
        cursor = conn.execute(query, args)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        if close_after:
            conn.close()


def query_one(query, args=(), conn=None):
    """Execute a SELECT query and return a single dict, or None."""
    close_after = False
    if conn is None:
        conn = get_connection()
        close_after = True
    try:
        cursor = conn.execute(query, args)
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        if close_after:
            conn.close()


def execute_mutation(query, args=(), conn=None):
    """Execute an INSERT, UPDATE, or DELETE query and commit."""
    close_after = False
    if conn is None:
        conn = get_connection()
        close_after = True
    try:
        cursor = conn.execute(query, args)
        if close_after:
            conn.commit()
        return cursor.lastrowid
    finally:
        if close_after:
            conn.close()
