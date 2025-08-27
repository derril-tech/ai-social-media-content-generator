from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
import re
from nats.aio.client import Client as NATS


class PolicyRequest(BaseModel):
  request_id: str
  platform: str
  content: str


class PolicyResponse(BaseModel):
  request_id: str
  platform: str
  approved: bool
  issues: list[str]


app = FastAPI(title="Policy Check Worker", version="0.1.0")


@app.get('/health')
async def health():
  return {"status": "ok", "service": "policy-check-worker"}


def check_policy(platform: str, content: str) -> list[str]:
  issues: list[str] = []
  banned = [r"free money", r"guaranteed", r"buy now", r"click here", r"\bDM\b"]
  for pat in banned:
    if re.search(pat, content, re.IGNORECASE):
      issues.append(f"Contains banned term: {pat}")
  if platform in ("instagram", "tiktok") and "http" in content:
    issues.append("Inline links discouraged on this platform")
  if content.count('#') > 30:
    issues.append("Too many hashtags")
  return issues


async def start_nats_loop():
  nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
  nc = NATS()
  await nc.connect(servers=[nats_url])

  async def handle_request(msg):
    try:
      payload = json.loads(msg.data.decode())
      req = PolicyRequest(**payload)
      issues = check_policy(req.platform, req.content)
      resp = PolicyResponse(request_id=req.request_id, platform=req.platform, approved=len(issues) == 0, issues=issues)
      subject = 'policy.approved' if resp.approved else 'policy.rejected'
      await nc.publish(subject, json.dumps(resp.model_dump()).encode())
    except Exception as e:
      await nc.publish('policy.failed', json.dumps({'error': str(e)}).encode())

  await nc.subscribe('policy.check', cb=handle_request)
  while True:
    await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
  asyncio.create_task(start_nats_loop())


