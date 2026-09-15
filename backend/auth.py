"""
UniMall Backend — Authentication & Authorization (backend/auth.py)
PBKDF2 password hashing, session tokens, role checks, and store-level authorization middleware.
"""

import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

from backend.db import get_connection, query_one, query_all, execute_mutation

SESSION_DURATION_DAYS = 7


# ─── PASSWORD SECURITY ──────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a unique salt."""
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100_000)
    return f"{salt.hex()}${dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a plain password against the stored salt$hash string."""
    try:
        salt_hex, hash_hex = stored_hash.split('$')
        salt = bytes.fromhex(salt_hex)
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100_000)
        return secrets.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


# ─── SESSION TOKENS ─────────────────────────────────────────────

def create_session(user_id: str) -> str:
    """Create a new session token in the database."""
    token = secrets.token_hex(32)
    now = datetime.utcnow()
    expires_at = (now + timedelta(days=SESSION_DURATION_DAYS)).isoformat()
    created_at = now.isoformat()

    execute_mutation(
        "INSERT INTO user_sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
        (token, user_id, expires_at, created_at)
    )
    return token


def invalidate_session(token: str):
    """Delete a session token on logout."""
    execute_mutation("DELETE FROM user_sessions WHERE token = ?", (token,))


def get_user_from_token(token: str):
    """Retrieve the user associated with an unexpired session token."""
    if not token:
        return None

    now_iso = datetime.utcnow().isoformat()
    session = query_one(
        "SELECT s.*, u.id as user_id, u.name, u.email, u.phone, u.role "
        "FROM user_sessions s "
        "JOIN users u ON s.user_id = u.id "
        "WHERE s.token = ? AND s.expires_at > ?",
        (token, now_iso)
    )
    if not session:
        return None

    user = {
        'id': session['user_id'],
        'name': session['name'],
        'email': session['email'],
        'phone': session['phone'],
        'role': session['role']
    }

    # Fetch store memberships
    memberships = query_all(
        "SELECT sm.store_id, sm.role as membership_role, s.name as store_name, s.slug as store_slug "
        "FROM store_memberships sm "
        "JOIN stores s ON sm.store_id = s.id "
        "WHERE sm.user_id = ?",
        (user['id'],)
    )
    user['stores'] = memberships
    return user


# ─── MIDDLEWARE / DECORATORS ────────────────────────────────────

def get_auth_token():
    """Extract Bearer token from Authorization header or cookie."""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:].strip()
    return request.args.get('token', '')


def require_auth(f):
    """Enforce that the request has a valid, authenticated user session."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_auth_token()
        user = get_user_from_token(token)
        if not user:
            return jsonify({'error': 'Unauthorized. Please sign in.'}), 401
        request.user = user
        return f(*args, **kwargs)
    return decorated


def require_role(*allowed_roles):
    """Enforce that the authenticated user possesses one of the specified roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'user'):
                token = get_auth_token()
                user = get_user_from_token(token)
                if not user:
                    return jsonify({'error': 'Unauthorized'}), 401
                request.user = user

            if request.user['role'] not in allowed_roles:
                return jsonify({'error': 'Forbidden. Insufficient role permissions.'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def require_store_access(f):
    """
    CRITICAL SECURITY ENFORCEMENT:
    Enforces that the authenticated user has explicit permission to manage the requested store.
    
    1. Platform Admin has global permission across all stores.
    2. Store Owner must possess a valid store_membership for the target store_id.
    3. Any other user is rejected with 403 Forbidden.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user'):
            token = get_auth_token()
            user = get_user_from_token(token)
            if not user:
                return jsonify({'error': 'Unauthorized'}), 401
            request.user = user

        # Platform Admin can manage any store (Founder impersonation/support mode)
        if request.user['role'] == 'platform_admin':
            return f(*args, **kwargs)

        # Get store_id from URL parameter or JSON body
        store_id = kwargs.get('store_id')
        if not store_id and request.is_json:
            store_id = request.json.get('store_id')

        if not store_id:
            return jsonify({'error': 'Missing store_id in request context'}), 400

        # Check membership in user's authorized stores
        authorized_store_ids = [m['store_id'] for m in request.user.get('stores', [])]
        if store_id not in authorized_store_ids:
            return jsonify({
                'error': f'Forbidden. You do not have permission to manage store "{store_id}".'
            }), 403

        return f(*args, **kwargs)
    return decorated


# ─── AUDIT LOGGING HELPER ───────────────────────────────────────

def log_audit(user_id: str, store_id: str, action: str, entity_type: str, entity_id: str, metadata: dict = None):
    """Record an audit trail event for operational accountability."""
    audit_id = f"aud_{secrets.token_hex(8)}"
    now_iso = datetime.utcnow().isoformat()
    meta_json = json.dumps(metadata or {})
    execute_mutation(
        "INSERT INTO audit_logs (id, user_id, store_id, action, entity_type, entity_id, metadata_json, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (audit_id, user_id, store_id, action, entity_type, entity_id, meta_json, now_iso)
    )
