from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
from nats.aio.client import Client as NATS


class OrchestrateRequest(BaseModel):
  request_id: str
  platform: str
  payload: dict


app = FastAPI(title="Publish Orchestrator", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "publish-orchestrator"}


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    payload = json.loads(msg.data.decode())
    req = OrchestrateRequest(**payload)
    subject_map = {
      'twitter': 'publish.twitter',
      'linkedin': 'publish.linkedin',
      'facebook': 'publish.meta',
      'instagram': 'publish.meta',
      'tiktok': 'publish.tiktok',
      'youtube': 'publish.youtube',
      'pinterest': 'publish.pinterest',
      'buffer': 'publish.buffer',
      'hootsuite': 'publish.buffer',
    }
    subject = subject_map.get(req.platform)
    if subject:
      await nc.publish(subject, json.dumps(req.payload).encode())

  await nc.subscribe('publish.orchestrate', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


