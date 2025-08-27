from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
import random
from nats.aio.client import Client as NATS


class VoiceTrainRequest(BaseModel):
  request_id: str
  brand_id: str
  examples: list[dict]  # [{ content, source }]
  constraints: dict | None = None


class VoiceTrainResponse(BaseModel):
  request_id: str
  voice_model_id: str
  metrics: dict


app = FastAPI(title="Voice Train Worker", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "voice-train-worker"}


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    payload = json.loads(msg.data.decode())
    req = VoiceTrainRequest(**payload)
    # Simulate training epochs
    for _ in range(3):
      await asyncio.sleep(0.5)
      # Normally would emit progress updates here
    voice_model_id = f"vm_{random.randint(1_000_000, 9_999_999)}"
    resp = VoiceTrainResponse(
      request_id=req.request_id,
      voice_model_id=voice_model_id,
      metrics={"accuracy": 0.88, "epochs": 3, "datasetSize": len(req.examples)},
    )
    await nc.publish('voice.train.complete', json.dumps(resp.model_dump()).encode())

  await nc.subscribe('voice.train.request', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


