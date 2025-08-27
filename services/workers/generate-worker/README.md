# Generate Worker

FastAPI worker that listens to NATS subjects and generates platform-specific content variants.

## Run locally

```bash
uvicorn app.main:app --reload --port 8101
```

Environment variables (see .env.example):
- NATS_URL
- OPENAI_API_KEY (stubbed usage in dev)

## NATS subjects
- gen.request → receive generation requests
- gen.complete → emit successful results
- gen.failed → emit error details


