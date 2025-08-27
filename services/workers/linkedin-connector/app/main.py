from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
import random
from nats.aio.client import Client as NATS


class LinkedInPublishRequest(BaseModel):
  request_id: str
  org_id: str | None = None
  content: str
  media: list[str] | None = None
  credentials: dict  # { client_id, client_secret, access_token }


class LinkedInPublishResponse(BaseModel):
  request_id: str
  external_id: str
  url: str | None = None


app = FastAPI(title="LinkedIn Connector", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "linkedin-connector"}


async def publish_linkedin(req: LinkedInPublishRequest) -> LinkedInPublishResponse:
  await asyncio.sleep(0.2)
  external_id = f"li_{random.randint(1_000_000, 9_999_999)}"
  return LinkedInPublishResponse(request_id=req.request_id, external_id=external_id, url=f"https://www.linkedin.com/feed/update/{external_id}")


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    payload = json.loads(msg.data.decode())
    req = LinkedInPublishRequest(**payload)
    retries = 3
    backoff = 0.5
    for attempt in range(1, retries + 1):
      try:
        resp = await publish_linkedin(req)
        await nc.publish('publish.success', json.dumps(resp.model_dump()).encode())
        return
      except Exception as e:
        if attempt == retries:
          await nc.publish('publish.failed', json.dumps({'request_id': req.request_id, 'error': str(e)}).encode())
        else:
          await asyncio.sleep(backoff)
          backoff *= 2

  await nc.subscribe('publish.linkedin', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


