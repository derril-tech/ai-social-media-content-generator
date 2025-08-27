from fastapi import FastAPI
from pydantic import BaseModel, Field
import asyncio
import os
import json
from datetime import datetime
from nats.aio.client import Client as NATS
import re


class GenerateRequest(BaseModel):
    request_id: str = Field(..., description="Correlation/request ID")
    brief_id: str
    brand_id: str
    voice_model_id: str | None = None
    platforms: list[str]
    language: str = "en"
    num_variants: int = 3
    topic: str
    audience: str | None = None
    tone: str | None = None
    constraints: dict | None = None


class Variant(BaseModel):
    platform: str
    content: str
    language: str
    hashtags: list[str] = []
    score: dict = {}


class GenerateResponse(BaseModel):
    request_id: str
    brief_id: str
    variants: list[Variant]
    generated_at: str


app = FastAPI(title="Generate Worker", version="0.1.0")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "generate-worker"}


async def start_nats_loop():
    nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
    nc = NATS()
    await nc.connect(servers=[nats_url])

    async def handle_gen_request(msg):
        try:
            payload = json.loads(msg.data.decode())
            req = GenerateRequest(**payload)

            # Stub generation: create simple variants with platform-tailored hooks
            hooks = {
                "twitter": "Quick tip:",
                "linkedin": "Insight:",
                "instagram": "Did you know?",
                "facebook": "Update:",
                "tiktok": "Hot take:",
                "youtube": "Pro tip:",
                "threads": "Thought:",
                "pinterest": "Idea:",
            }

            variants: list[Variant] = []
            for platform in req.platforms:
                for i in range(req.num_variants):
                    hook = hooks.get(platform, "Note:")
                    content = f"{hook} {req.topic}. Tailored for {platform}."
                    # naive hashtag extraction
                    hashtags = [t.strip('#') for t in re.findall(r"#(\w+)", content)]
                    # basic scoring (keep in sync with TS scoring heuristics at high level)
                    score = {
                        "brandFit": 0.8,
                        "readability": 0.85,
                        "policyRisk": 0.9,
                        "overall": 0.85,
                    }
                    variants.append(
                        Variant(
                            platform=platform,
                            content=content,
                            language=req.language,
                            hashtags=hashtags,
                            score=score,
                        )
                    )

            resp = GenerateResponse(
                request_id=req.request_id,
                brief_id=req.brief_id,
                variants=variants,
                generated_at=datetime.utcnow().isoformat(),
            )

            await nc.publish("gen.complete", json.dumps(resp.model_dump()).encode())

        except Exception as e:
            err = {
                "error": str(e),
                "payload": msg.data.decode(errors="ignore"),
            }
            await nc.publish("gen.failed", json.dumps(err).encode())

    await nc.subscribe("gen.request", cb=handle_gen_request)

    # Keep running
    while True:
        await asyncio.sleep(3600)


@app.on_event("startup")
async def on_startup():
    asyncio.create_task(start_nats_loop())


