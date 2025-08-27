from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
from urllib.parse import urlencode, urlparse, parse_qsl, urlunparse
from nats.aio.client import Client as NATS


class LinkRequest(BaseModel):
  request_id: str
  url: str
  utm_source: str = "social"
  utm_medium: str = "organic"
  utm_campaign: str
  utm_content: str | None = None
  shorten: bool = False


class LinkResponse(BaseModel):
  request_id: str
  url: str
  short_url: str | None = None


app = FastAPI(title="Link Worker", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "link-worker"}


def add_utm(url: str, params: dict) -> str:
  parsed = urlparse(url)
  q = dict(parse_qsl(parsed.query))
  q.update(params)
  new_query = urlencode(q, doseq=True)
  return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    try:
      payload = json.loads(msg.data.decode())
      req = LinkRequest(**payload)
      with_utm = add_utm(req.url, {
        'utm_source': req.utm_source,
        'utm_medium': req.utm_medium,
        'utm_campaign': req.utm_campaign,
        **({'utm_content': req.utm_content} if req.utm_content else {}),
      })

      short = None
      # Stub shortener
      if req.shorten:
        short = with_utm if len(with_utm) < 60 else with_utm[:60] + '...'

      resp = LinkResponse(request_id=req.request_id, url=with_utm, short_url=short)
      await nc.publish('link.complete', json.dumps(resp.model_dump()).encode())
    except Exception as e:
      await nc.publish('link.failed', json.dumps({'error': str(e)}).encode())

  await nc.subscribe('link.request', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


