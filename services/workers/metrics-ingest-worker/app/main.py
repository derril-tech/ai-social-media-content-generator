from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
from nats.aio.client import Client as NATS


class MetricsIngestRequest(BaseModel):
  request_id: str
  platform: str
  external_post_id: str
  metrics: dict  # raw metrics from platform


class MetricsIngestResponse(BaseModel):
  request_id: str
  normalized: dict


app = FastAPI(title="Metrics Ingest Worker", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "metrics-ingest-worker"}


def normalize_metrics(raw: dict) -> dict:
  # Map to likes, comments, shares, saves, impressions, clicks, ctr
  likes = raw.get('likes') or raw.get('reactions', 0)
  comments = raw.get('comments', 0)
  shares = raw.get('shares', 0)
  saves = raw.get('saves', 0)
  impressions = raw.get('impressions', raw.get('views', 0))
  clicks = raw.get('clicks', 0)
  ctr = round((clicks / impressions), 4) if impressions else 0
  return {
    'likes': likes,
    'comments': comments,
    'shares': shares,
    'saves': saves,
    'impressions': impressions,
    'clicks': clicks,
    'ctr': ctr,
  }


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    payload = json.loads(msg.data.decode())
    req = MetricsIngestRequest(**payload)
    normalized = normalize_metrics(req.metrics)
    resp = MetricsIngestResponse(request_id=req.request_id, normalized=normalized)
    await nc.publish('metrics.processed', json.dumps(resp.model_dump()).encode())

  await nc.subscribe('metrics.ingest', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


