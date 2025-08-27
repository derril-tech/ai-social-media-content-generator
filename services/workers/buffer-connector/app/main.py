from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
import random
from nats.aio.client import Client as NATS


class BufferPublishRequest(BaseModel):
  request_id: str
  content: str
  profile_id: str
  credentials: dict


class BufferPublishResponse(BaseModel):
  request_id: str
  external_id: str


app = FastAPI(title="Buffer/Hootsuite Connector", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "buffer-connector"}


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    payload = json.loads(msg.data.decode())
    req = BufferPublishRequest(**payload)
    await asyncio.sleep(0.2)
    resp = BufferPublishResponse(request_id=req.request_id, external_id=f"bf_{random.randint(1_000_000,9_999_999)}")
    await nc.publish('publish.success', json.dumps(resp.model_dump()).encode())

  await nc.subscribe('publish.buffer', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


