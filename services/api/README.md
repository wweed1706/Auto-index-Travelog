# ReTrip FastAPI API

This starter contains **only** a health endpoint. Trip, photo, authentication, indexing, and AI routes have not been implemented.

## Requirements

Python 3.11+

## Start

~~~bash
cd services/api
python -m venv .venv
# Activate the virtual environment for your OS
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
~~~

Then open http://localhost:8000/docs and http://localhost:8000/health.

## Tests

~~~bash
pytest -q
ruff check .
~~~

Use **.env.example** only as a non-secret configuration reference. Do not commit a real .env file.

## API conventions (proposal)

- Version business routes under **/api/v1/** once designed.
- Validate ownership server-side, never trust trip/user IDs from the client.
- Return an asynchronous job ID for long-running photo processing.
- Keep original metadata, normalized metadata and inferred values separate.
- Add migrations before introducing persistent models.
