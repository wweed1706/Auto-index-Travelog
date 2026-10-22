# Infrastructure notes

Planned: Dockerized FastAPI backend, managed PostgreSQL/PostGIS and private S3-compatible object storage. Neither the database nor storage provider is configured in the starter.

- Develop locally first; validate CPU performance before committing to a GPU provider.
- Introduce task queues only after the photo-processing pipeline has measurable needs.
- Store secrets in local environment variables or your deployment platform's secret manager.
- Never upload user photos or GPS metadata to CI artifacts or the public repository.
