"""Minimal ReTrip API bootstrap.

Business endpoints are intentionally deferred until their contracts are agreed.
"""

from fastapi import FastAPI

app = FastAPI(
    title="ReTrip API",
    description="Travel memory auto-indexing backend (starter)",
    version="0.1.0",
)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    """Liveness check for local development and continuous integration."""
    return {"status": "ok", "service": "retrip-api"}
