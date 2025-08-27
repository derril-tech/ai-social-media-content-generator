from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
from nats.aio.client import Client as NATS


class HashtagRequest(BaseModel):
  request_id: str
  topic: str
  competitors: list[str] | None = None
  language: str = "en"
  platform: str = "linkedin"
  max_tags: int = 10


class HashtagResponse(BaseModel):
  request_id: str
  hashtags: list[dict]


app = FastAPI(title="Hashtag Worker", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "hashtag-worker"}


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    try:
      payload = json.loads(msg.data.decode())
      req = HashtagRequest(**payload)

      # Stub ranking: topic word variants and simple popularity heuristic
      base = req.topic.lower().split()[0]
      candidates = [
        base,
        f"{base}tips",
        f"{base}strategy",
        f"{base}growth",
        f"{base}101",
        f"{base}guide",
        f"{base}marketing",
        f"{base}content",
        f"{base}ai",
        f"{base}trends",
      ]
      seen = set()
      ranked = []
      for i, tag in enumerate(candidates):
        if tag in seen: continue
        seen.add(tag)
        popularity = max(0.1, 1 - i * 0.08)
        relevance = max(0.2, 1 - i * 0.05)
        score = round((popularity * 0.6 + relevance * 0.4), 2)
        ranked.append({"tag": tag, "popularity": round(popularity, 2), "relevance": round(relevance, 2), "score": score})

      ranked = sorted(ranked, key=lambda x: x["score"], reverse=True)[: req.max_tags]
      resp = HashtagResponse(request_id=req.request_id, hashtags=ranked)
      await nc.publish("hashtag.complete", json.dumps(resp.model_dump()).encode())

    except Exception as e:
      await nc.publish("hashtag.failed", json.dumps({"error": str(e)}).encode())

  await nc.subscribe("hashtag.request", cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


