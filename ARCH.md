# ARCH.md — AI Social Media Content Generator

## Topology
- **Frontend/BFF:** Next.js 14 (Vercel). Server Actions for presigned uploads/light mutations; SSR for calendar/editor; WS/SSE for live updates.
- **API Gateway:** NestJS (Node 20); OpenAPI 3.1; Zod DTOs; Problem+JSON; RBAC (Casbin); RLS; rate limits; Idempotency-Key; Request-ID (ULID).
- **Workers (Python 3.11 + FastAPI control):**
  - voice-train-worker (style embeddings, constraints)
  - generate-worker (platform copy + variants)
  - hashtag-worker (ranker; shadow-ban avoidance)
  - link-worker (UTM builder + shortener)
  - image-prompt-worker (thumbnail/cover prompts)
  - policy-check-worker (platform lints, disclosure)
  - translate-worker (locale idioms)
  - schedule-worker (best-time hints + queues)
  - publish-worker (platform APIs & Buffer/Hootsuite)
  - ingest-metrics-worker (poll/webhook normalize)
  - report-worker (CSV/PDF/JSON)
- **Event Bus/Queues:** NATS (`brief.*`, `gen.*`, `policy.*`, `publish.*`, `metrics.*`) + Redis Streams; Celery/RQ orchestration.
- **Datastores:** Postgres 16 + pgvector (multi-tenant with RLS); S3/R2 (assets); Redis (cache/session/tokens); optional ClickHouse (high-volume metrics).
- **Observability:** OpenTelemetry traces/metrics/logs; Prometheus/Grafana; Sentry.
- **Secrets:** Cloud/KMS; per-connector token scopes; rotation.

## Data Model (high-level)
- **Tenancy:** orgs, users, memberships (roles: owner, admin, editor, reviewer, viewer).
- **Branding:** brands (colors/fonts/guidelines), voice_models (embedding, params).
- **Campaigns:** briefs (topic/audience/tone/languages/platforms/regions/competitors/constraints).
- **Posts:** posts (platform, status, schedule), variants (content, tags, risk/score, language).
- **Assets:** media with rights/expiry; templates.
- **Connectors:** per platform with config/enabled.
- **Experiments & Metrics:** experiments (A/B splits), metrics (likes/comments/shares/saves/impressions/clicks/ctr/followers_delta).
- **Governance:** comments, audit_log.

## API Surface (REST `/v1`)
- **Auth/Users:** `/auth/login`, `/auth/refresh`, `/me`, `/usage`.
- **Brands/Voice:** `POST /brands`, `POST /brands/:id/voice/train`, `GET /brands/:id/voice`.
- **Campaigns/Briefs:** `POST /campaigns`, `POST /briefs`, `GET /briefs/:id`.
- **Generation:** `POST /posts/generate {brief_id}`, `POST /variants/:id/rewrite`, `POST /variants/:id/score`.
- **Scheduling/Publishing:** `POST /posts/:id/schedule`, `POST /posts/:id/publish`, `POST /connectors`, `GET /connectors/:id/status`.
- **Experiments/Metrics:** `POST /experiments`, `GET /metrics`, `POST /metrics/ingest`.
- **Assets:** `POST /assets` (signed upload), `GET /assets`.
- **Comments/Audit:** `POST /comments`, `GET /audit`.
- Conventions: Idempotency-Key on mutations; Problem+JSON errors; cursor pagination; per-org/channel rate limits.

## Pipelines
1. **Train Voice:** ingest examples → embeddings → style constraints (tone, sentence length, emoji/jargon thresholds).
2. **Generate:** for each platform → render prompt (brand + policy + template) → produce N variants → score (brand fit/risk/readability) → store.
3. **Enrich:** hashtags ranked; link worker adds UTM + shortens; image prompts generated.
4. **Schedule/Publish:** queue by timezone/best-time; publish via platform APIs; retries/backoff; persist external IDs.
5. **Metrics:** poll/webhooks normalize metrics → store; update experiments; compute CTR; insights.
6. **Report:** CSV/PDF/JSON exports per campaign/brand.

## Realtime
- WS: generation progress, lints, schedule/publish status.
- Live metrics ticker and experiment dashboards.

## Caching & Performance
- Redis: brand voice cache, hashtag ranks, connector tokens, rate-limit counters.
- Batch generation; streaming previews; backpressure on publish spikes; per-connector concurrency caps.

## Security & Compliance
- TLS/HSTS/CSP; KMS-encrypted secrets; signed URLs; Postgres RLS; S3 prefix isolation.
- Least-privilege tokens for platform APIs; disclosure/PAID toggles; policy guardrails.
- DSR endpoints; retention policies; immutable audit_log.

## SLOs
- Time-to-first variant < **6s p95**; publish success ≥ **99%**; metrics ingest lag < **2min p95**; API 5xx < **0.5%/1k**.
