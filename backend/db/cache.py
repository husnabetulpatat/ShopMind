"""
ShopMind — Redis Bağlantı Katmanı

Cache yönetimi ve Redis bağlantı havuzu.
"""

from __future__ import annotations

import json
from typing import Any

import redis.asyncio as aioredis
from loguru import logger

from backend.config import settings

# Global Redis bağlantısı
_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """
    Redis bağlantısını döndürür. Lazy initialization kullanır.

    Returns:
        Redis client instance
    """
    global _redis_client

    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        logger.info("🔗 Redis bağlantısı oluşturuldu")

    return _redis_client


async def close_redis() -> None:
    """Redis bağlantısını kapatır."""
    global _redis_client

    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
        logger.info("🔌 Redis bağlantısı kapatıldı")


async def cache_get(key: str) -> Any | None:
    """
    Cache'den değer okur.

    Args:
        key: Anahtar

    Returns:
        Değer veya None
    """
    redis = await get_redis()
    value = await redis.get(key)

    if value is not None:
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value

    return None


async def cache_set(key: str, value: Any, ttl: int = 3600) -> None:
    """
    Cache'e değer yazar.

    Args:
        key: Anahtar
        value: Değer
        ttl: Yaşam süresi (saniye, varsayılan 1 saat)
    """
    redis = await get_redis()

    if isinstance(value, (dict, list)):
        value = json.dumps(value, ensure_ascii=False)

    await redis.setex(key, ttl, value)


async def cache_delete(key: str) -> None:
    """
    Cache'den anahtar siler.

    Args:
        key: Silinecek anahtar
    """
    redis = await get_redis()
    await redis.delete(key)


async def cache_exists(key: str) -> bool:
    """
    Anahtarın cache'de var olup olmadığını kontrol eder.

    Args:
        key: Kontrol edilecek anahtar

    Returns:
        True / False
    """
    redis = await get_redis()
    return await redis.exists(key) > 0
