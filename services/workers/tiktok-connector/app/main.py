from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
import random
from nats.aio.client import Client as NATS


class TikTokPublishRequest(BaseModel):
  request_id: str
  caption: str
  media_id: str | None = None
  credentials: dict


class TikTokPublishResponse(BaseModel):
  request_id: str
  external_id: str
  url: str | None = None


app = FastAPI(title="TikTok Connector", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "tiktok-connector"}


async def publish_tiktok(req: TikTokPublishRequest) -> TikTokPublishResponse:
  await asyncio.sleep(0.2)
  external_id = f"tt_{random.randint(1_000_000, 9_999_999)}"
  return TikTokPublishResponse(request_id=req.request_id, external_id=external_id, url=None)


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    payload = json.loads(msg.data.decode())
    req = TikTokPublishRequest(**payload)
    retries = 3
    backoff = 0.5
    for attempt in range(1, retries + 1):
      try:
        resp = await publish_tiktok(req)
        await nc.publish('publish.success', json.dumps(resp.model_dump()).encode())
        return
      except Exception as e:
        if attempt == retries:
          await nc.publish('publish.failed', json.dumps({'request_id': req.request_id, 'error': str(e)}).encode())
        else:
          await asyncio.sleep(backoff)
          backoff *= 2

  await nc.subscribe('publish.tiktok', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


