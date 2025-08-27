# PLAN.md — AI Social Media Content Generator

## Goal
Ship a multi-tenant SaaS that turns a brief + brand voice into on-brand, platform-specific posts (X, LinkedIn, Instagram, Facebook, TikTok captions/scripts, YouTube Shorts titles/descriptions, Threads, Pinterest), with scheduling, A/B tests, connectors, analytics, and an asset library.

## Build Strategy
- Single continuous build (no stages): infra → APIs → workers → UI → connectors → analytics.
- Frontend: Next.js 14, Ant Design + Tailwind; SSR for calendar/editor; WS/SSE for streams.
- Backend: NestJS API gateway; Python workers for generation, policy checks, hashtags, links, translation, scheduling, publishing, metrics, reporting.
- Storage & compute: Postgres 16 + pgvector; Redis (cache/session); NATS (events); S3/R2 (assets); optional ClickHouse for metrics.
- Content guardrails: platform policy lints, disclosure toggles, restricted domains (politics/medical/financial) with stricter review.
- Connectors: direct platform APIs where available; Buffer/Hootsuite fallback when needed.
- CI/CD: GitHub Actions + Terraform; blue/green deploys; observability with OTel + Prometheus + Sentry.

## Deliverables
- Brief Wizard + Brand Voice trainer.
- Generator producing N variants per platform with hooks/CTAs/hashtags, multi-lingual support, image prompts.
- Editor with per-platform linting, tone/length sliders, rewrite ops.
- Calendar/queues with best-time recommendations; approvals.
- Publishing via connectors + retries/backoff; status tracking.
- A/B experiments and metrics ingestion; reports and insights.
- Asset library with licenses/expiry.
- RBAC, audit log, billing (seats + usage), retention and DSR endpoints.

## Non-Goals (V1)
- Long-form blog generation.
- In-app image editor (use prompts and external generation/stock).
- Advanced MMM/attribution beyond UTM + clicks/impressions.

## Success Criteria
- Time-to-first variant < **6s p95** after “Generate”.
- Publish success ≥ **99%** (excl. provider outages).
- Metrics ingest lag < **2min p95**.
- Throughput ≥ **50 approved posts/user/week**; CTR lift ≥ **20%** vs baseline after 2 weeks.
