"""Agent personality profiles for behavioral consistency."""

import json
import os
from typing import Dict, Any, Optional
from pathlib import Path

PERSONALITIES_DIR = Path(__file__).parent

def load_personality(profile_id: str) -> Optional[Dict[str, Any]]:
    """Load personality profile by ID."""
    profile_path = PERSONALITIES_DIR / f"{profile_id}.json"
    if profile_path.exists():
        with open(profile_path, 'r') as f:
            return json.load(f)
    return None

def get_available_personalities() -> Dict[str, str]:
    """Get available personality profiles with their names."""
    personalities = {}
    for file_path in PERSONALITIES_DIR.glob("*.json"):
        if file_path.name != "__init__.py":
            profile_id = file_path.stem
            try:
                profile = load_personality(profile_id)
                if profile:
                    personalities[profile_id] = profile.get("name", profile_id)
            except:
                continue
    return personalities

def get_default_personality() -> Dict[str, Any]:
    """Get default personality profile."""
    return {
        "profile_id": "Default",
        "name": "Balanced AI Assistant",
        "tone": "professional, balanced",
        "decision_style": "analytical, evidence-based",
        "communication_style": "clear, structured",
        "max_temperature": 0.7,
        "risk_tolerance": 0.5,
        "reasoning_depth": "thorough"
    }