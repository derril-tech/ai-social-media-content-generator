from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
from datetime import datetime, timedelta
from nats.aio.client import Client as NATS


class ScheduleRequest(BaseModel):
  request_id: str
  platform: str
  region: str = 'US'
  timezone: str = 'UTC'
  count: int = 5


class ScheduleResponse(BaseModel):
  request_id: str
  slots: list[str]


app = FastAPI(title="Schedule Worker", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "schedule-worker"}


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    try:
      payload = json.loads(msg.data.decode())
      req = ScheduleRequest(**payload)
      now = datetime.utcnow().replace(microsecond=0)
      # naive slots: every 3 hours starting next hour
      base = now + timedelta(hours=1)
      slots = [(base + timedelta(hours=i * 3)).isoformat() + 'Z' for i in range(req.count)]
      resp = ScheduleResponse(request_id=req.request_id, slots=slots)
      await nc.publish('schedule.complete', json.dumps(resp.model_dump()).encode())
    except Exception as e:
      await nc.publish('schedule.failed', json.dumps({'error': str(e)}).encode())

  await nc.subscribe('schedule.request', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


