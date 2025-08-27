from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
from nats.aio.client import Client as NATS


class ImagePromptRequest(BaseModel):
  request_id: str
  topic: str
  brand: dict | None = None  # { name, colors, fonts, guidelines }
  style: str | None = None
  platform: str | None = None


class ImagePromptResponse(BaseModel):
  request_id: str
  prompt: str


app = FastAPI(title="Image Prompt Worker", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "image-prompt-worker"}


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    try:
      payload = json.loads(msg.data.decode())
      req = ImagePromptRequest(**payload)
      brand_hint = ''
      if req.brand:
        colors = ', '.join(req.brand.get('colors', [])[:3])
        brand_hint = f" Use brand colors: {colors}."
      style_hint = f" Style: {req.style}." if req.style else ''
      platform_hint = f" Platform: {req.platform}." if req.platform else ''
      prompt = f"Create a high-contrast thumbnail about '{req.topic}'.{brand_hint}{style_hint}{platform_hint} Include legible text overlay and ample whitespace."
      resp = ImagePromptResponse(request_id=req.request_id, prompt=prompt)
      await nc.publish('imageprompt.complete', json.dumps(resp.model_dump()).encode())
    except Exception as e:
      await nc.publish('imageprompt.failed', json.dumps({'error': str(e)}).encode())

  await nc.subscribe('imageprompt.request', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


