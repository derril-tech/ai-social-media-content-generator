from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
from nats.aio.client import Client as NATS


class TranslateRequest(BaseModel):
  request_id: str
  content: str
  source_lang: str = 'en'
  target_lang: str = 'es'


class TranslateResponse(BaseModel):
  request_id: str
  content: str
  target_lang: str


app = FastAPI(title="Translate Worker", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "translate-worker"}


def mock_translate(text: str, target: str) -> str:
  # Placeholder translate stub
  return f"[{target}] {text}"


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    try:
      payload = json.loads(msg.data.decode())
      req = TranslateRequest(**payload)
      translated = mock_translate(req.content, req.target_lang)
      resp = TranslateResponse(request_id=req.request_id, content=translated, target_lang=req.target_lang)
      await nc.publish('translate.complete', json.dumps(resp.model_dump()).encode())
    except Exception as e:
      await nc.publish('translate.failed', json.dumps({'error': str(e)}).encode())

  await nc.subscribe('translate.request', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


