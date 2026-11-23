"""
Límite de intentos en memoria (ventana deslizante). Suficiente para una sola
instancia de la API; con varias réplicas, mover a Redis manteniendo la interfaz.
"""
from __future__ import annotations

import time
from collections import deque
from threading import Lock


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit, self.window = limit, window_seconds
        self._hits: dict[str, deque[float]] = {}
        self._lock = Lock()

    def allow(self, key: str, *, now: float | None = None) -> bool:
        """Registra un intento y devuelve False si la clave superó el límite."""
        t = time.monotonic() if now is None else now
        with self._lock:
            q = self._hits.setdefault(key, deque())
            while q and q[0] <= t - self.window:
                q.popleft()
            if len(q) >= self.limit:
                return False
            q.append(t)
            if len(self._hits) > 50_000:  # evita crecer sin límite
                self._hits = {k: v for k, v in self._hits.items() if v and v[-1] > t - self.window}
            return True


# Consulta de pedidos: limita por IP y por código para impedir adivinar combinaciones
track_by_ip = SlidingWindowLimiter(limit=30, window_seconds=600)
track_by_code = SlidingWindowLimiter(limit=10, window_seconds=600)
# Creación de pedidos desde el sitio
orders_by_ip = SlidingWindowLimiter(limit=12, window_seconds=3600)
