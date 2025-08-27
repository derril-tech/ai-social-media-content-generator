# AI SOCIAL MEDIA CONTENT GENERATOR — END‑TO‑END PRODUCT BLUEPRINT

*(React 18 + Next.js 14 App Router; **Ant Design** + Tailwind utilities; TypeScript‑first contracts; Node/NestJS API gateway; Python NLP/LLM workers; Postgres + pgvector; Redis; S3/R2 for assets; NATS event bus; optional ClickHouse for analytics; multi‑tenant; seats + usage‑based billing.)*

---

## 1) Product Description & Presentation

**One‑liner**
“Give us a topic, audience, and tone — get on‑brand posts for each platform, scheduled with images, hooks, hashtags, and UTM links.”

**What it produces**

* **Platform‑specific posts** for X (Twitter), LinkedIn, Instagram (captions), Facebook, TikTok (captions/scripts), YouTube Shorts (titles/descriptions), Threads, Pinterest.
* **Creative bundles**: 5–10 variations per platform (hooks, CTAs, length variants, carousel copy).
* **Media prompts & assets**: suggested images, B‑roll prompts, thumbnail text; optional image generation via provider.
* **Calendars & campaigns**: scheduled posts with time‑zone logic and best‑time recommendations.
* **Reports**: A/B outcomes, engagement/CTR/CPA where available, copy insights.

**Scope/Safety**

* No impersonation or deceptive claims; political, medical, or financial advice modes are restricted with stricter review.
* Platform policy compliance checks (spammy patterns, banned words, link policy).
* PAID/AD labeling toggle and disclosure reminders.

---

## 2) Target User

* Solo creators, growth marketers, social media managers, agencies.
* SMBs/startups needing consistent multi‑platform content.
* Product teams launching features with coordinated campaigns.

---

## 3) Features & Functionalities (Extensive)

### Brief & Brand Voice

* **Brief wizard**: topic, audience, tone (professional/witty/inspirational/technical), objective (awareness/leads/traffic), platforms, regions/languages, competitors.
* **Brand voice**: upload examples/URLs; learn style guide (word bank, no‑go phrases, reading level).
* **Compliance presets**: industry (SaaS, fintech, health, education) → constraints.

### Generation & Variations

* **Per‑platform templates**: character limits, hashtags placement, mentions, link wrapping, line breaks.
* **Hooks**: listicle/open‑loop/question/statistic/contrarian; **CTA** variations (comment/subscribe/signup).
* **Hashtag & keyword miner**: based on topic + competitor sampling; ranks by popularity/relevance; avoid shadow‑banned tags.
* **Multi‑lingual**: generate in target locales with locale‑aware idioms.
* **Image prompts**: short prompts for thumbnails/covers; brand color & font suggestions.

### Editing & Review

* **Side‑by‑side variants** with scoring (readability, brand fit, policy risk).
* **Tone & length sliders**, emoji density, hashtag count control.
* **Rewrite ops**: simplify, expand, make more technical, add statistic, remove buzzwords, add question.
* **Fact‑checks**: optional citation requirement for claims; link suggestions to owned content.

### Scheduling & Publishing

* **Calendar** with best‑time recommendations (by platform & audience region).
* **Queues** and **slots** (e.g., M‑W‑F 9am, topic pillars).
* **Auto‑adapters**: shorten URLs with UTM; thread/carousel/caption splitting; alt‑text prompts.
* **Connectors**: X/Twitter API (v2), LinkedIn Marketing APIs, Facebook/Instagram (Meta Graph), YouTube Data API, TikTok Business API (where available), Pinterest; **Buffer/Hootsuite** fallback.

### A/B Testing & Analytics

* **Experiments**: randomize variants A/B (or A/B/C) by time or audience cohort.
* **Metrics ingestion**: likes, replies/comments, shares, saves, CTR (from shortened links), follower delta.
* **Attribution**: UTM builder + link shortener; webhook to GA4 for campaign tagging.
* **Insights**: topic, hook, and CTA performance; hashtag impact; language/region breakdown.

### Asset Library

* **Media storage**: brand kit (logos, colors, fonts), stock integrations, generated images, video snippets.
* **Rights management**: license metadata, expiry reminders.
* **Templates**: carousel frames, thumbnail text presets, caption shells.

### Collaboration & Governance

* Roles: Owner, Admin, Editor, Reviewer, Viewer.
* **Approval flows** with comments and required sign‑off before publish.
* **Workspace/brand separation**; client workspaces for agencies.
* **Audit log** for changes, approvals, and publishes.

---

## 4) Backend Architecture (Extremely Detailed & Deployment‑Ready)

### 4.1 Topology

* **Frontend/BFF:** Next.js 14 (Vercel). Server Actions for presigned URLs & light mutations; SSR for calendar and editor views.
* **API Gateway:** **NestJS (Node 20)** — REST `/v1` (OpenAPI 3.1), Zod validation, Problem+JSON, RBAC (Casbin), RLS, rate limits, Idempotency‑Key, Request‑ID (ULID).
* **Workers (Python 3.11 + FastAPI control):**
  `voice-train-worker` (style learning), `generate-worker` (platform copy), `hashtag-worker`, `link-worker` (UTM + shortener), `image-prompt-worker`, `policy-check-worker`, `translate-worker`, `schedule-worker`, `publish-worker` (channel APIs), `ingest-metrics-worker`, `report-worker`.
* **Event Bus/Queues:** NATS (subjects: `brief.*`, `gen.*`, `policy.*`, `publish.*`, `metrics.*`) + Redis Streams; Celery/RQ orchestration.
* **Datastores:** Postgres 16 + pgvector; S3/R2 for assets; Redis for cache/session; optional ClickHouse for high‑volume metrics.
* **Observability:** OpenTelemetry traces/logs/metrics; Prometheus/Grafana; Sentry.
* **Secrets:** Cloud Secrets Manager/KMS.

### 4.2 Data Model (Postgres + pgvector)

```sql
-- Tenancy & Identity
CREATE TABLE orgs (
  id UUID PRIMARY KEY, name TEXT NOT NULL, plan TEXT DEFAULT 'pro', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE users (
  id UUID PRIMARY KEY, org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  email CITEXT UNIQUE NOT NULL, name TEXT, role TEXT DEFAULT 'editor', tz TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE memberships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  workspace_role TEXT CHECK (workspace_role IN ('owner','admin','editor','reviewer','viewer')),
  PRIMARY KEY (user_id, org_id)
);

-- Brands & Voice
CREATE TABLE brands (
  id UUID PRIMARY KEY, org_id UUID, name TEXT, colors JSONB, fonts JSONB, guidelines TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE voice_models (
  id UUID PRIMARY KEY, brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  corpus_uri TEXT, params JSONB, embedding VECTOR(1536), created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaigns & Briefs
CREATE TABLE campaigns (
  id UUID PRIMARY KEY, brand_id UUID, name TEXT, objective TEXT, start_date DATE, end_date DATE, budget NUMERIC, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE briefs (
  id UUID PRIMARY KEY, campaign_id UUID, topic TEXT, audience TEXT, tone TEXT, languages TEXT[], platforms TEXT[], regions TEXT[], competitors TEXT[], constraints JSONB, created_at TIMESTAMPTZ DEFAULT now()
);

-- Posts & Variants
CREATE TABLE posts (
  id UUID PRIMARY KEY, campaign_id UUID, brand_id UUID, brief_id UUID, platform TEXT,
  status TEXT CHECK (status IN ('draft','review','approved','scheduled','published','failed')) DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ, published_at TIMESTAMPTZ, created_by UUID, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE variants (
  id UUID PRIMARY KEY, post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  label TEXT, content TEXT, hashtags TEXT[], mentions TEXT[], link TEXT, utm JSONB, risk JSONB,
  score JSONB, language TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

-- Assets & Media
CREATE TABLE assets (
  id UUID PRIMARY KEY, brand_id UUID, kind TEXT, s3_key TEXT, meta JSONB, rights JSONB, created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedules & Connectors
CREATE TABLE schedules (
  id UUID PRIMARY KEY, brand_id UUID, cron TEXT, timezone TEXT, pillar TEXT, active BOOLEAN DEFAULT TRUE
);
CREATE TABLE connectors (
  id UUID PRIMARY KEY, brand_id UUID, platform TEXT, config JSONB, enabled BOOLEAN DEFAULT TRUE
);

-- Experiments & Metrics
CREATE TABLE experiments (
  id UUID PRIMARY KEY, post_id UUID, variant_a UUID, variant_b UUID, split NUMERIC, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ
);
CREATE TABLE metrics (
  id BIGSERIAL PRIMARY KEY, post_id UUID, platform TEXT, ts TIMESTAMPTZ,
  likes BIGINT, comments BIGINT, shares BIGINT, saves BIGINT, impressions BIGINT, clicks BIGINT, ctr NUMERIC, followers_delta BIGINT
);

-- Audit & Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY, post_id UUID, author UUID, anchor JSONB, body TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY, org_id UUID, user_id UUID, brand_id UUID, action TEXT, target TEXT, meta JSONB, created_at TIMESTAMPTZ DEFAULT now()
);
```

**Invariants**

* RLS by `org_id`/`brand_id`; connectors scoped per brand.
* A `post` may have many `variants`; only one variant publishes per platform per scheduled time (unless experiment configured).
* Experiments enforce split and end when significance threshold or end date reached.

### 4.3 API Surface (REST `/v1`, OpenAPI)

**Auth/Orgs/Users**

* `POST /auth/login`, `POST /auth/refresh`, `GET /me`, `GET /usage`.

**Brands & Voice**

* `POST /brands` `{name, colors?, fonts?, guidelines?}`
* `POST /brands/:id/voice/train` `{corpus_uri|examples[]}`
* `GET /brands/:id/voice` snapshot

**Campaigns & Briefs**

* `POST /campaigns` `{brand_id, name, objective, dates}`
* `POST /briefs` `{campaign_id, topic, audience, tone, languages, platforms, regions, competitors, constraints}`
* `GET /briefs/:id`

**Generation**

* `POST /posts/generate` `{brief_id}` → creates posts + variants per platform
* `POST /variants/:id/rewrite` `{ops:['shorten','add_hashtag','simplify','add_stat',...]}`
* `POST /variants/:id/score` → brand fit / risk / readability

**Scheduling & Publishing**

* `POST /posts/:id/schedule` `{datetime, timezone}`
* `POST /posts/:id/publish` (immediate)
* `POST /connectors` `{brand_id, platform, config}`
* `GET /connectors/:id/status`

**Experiments & Metrics**

* `POST /experiments` `{post_id, variant_a, variant_b, split}`
* `GET /metrics?post_id&from&to`
* `POST /metrics/ingest` (webhooks from platforms/shortener)

**Assets**

* `POST /assets` → upload URL
* `GET /assets?brand_id&kind`

**Conventions**

* Idempotency‑Key on mutations; Problem+JSON errors; cursor pagination; rate limits per connector.

### 4.4 Pipelines & Workers

**Train Voice**

1. Ingest examples → build embeddings → derive style constraints (tone, sentence length, emoji usage, jargon threshold).
   **Generate**
2. For each platform: render prompt with style + policy → produce N variants → score → policy check → store.
   **Enrich**
3. Hashtag worker mines and ranks tags; link worker applies UTM and shortens (Bitly/self‑hosted).
   **Schedule/Publish**
4. Scheduler dispatches publish jobs at local time; publish worker calls platform APIs; retries with backoff; records post IDs.
   **Ingest Metrics**
5. Poll or receive webhooks → normalize metrics → store; update experiments; compute CTR from clicks/impressions.
   **Report**
6. Generate downloadable CSV/PDF/JSON reports per campaign.

### 4.5 Realtime

* WS streams for generation progress, policy warnings, and schedule status.
* Live metric ticks for recent posts; experiment dashboards update in place.

### 4.6 Caching & Performance

* Redis: brand voice caches, hashtag ranks, connector tokens, rate‑limit counters.
* Batch generation across platforms; streaming tokens for editor preview.
* Backpressure on publish spikes; per‑connector concurrency control.

### 4.7 Observability

* OTel spans across `voice.train`, `gen.variant`, `policy.check`, `publish.call`, `metrics.ingest`.
* Metrics: time‑to‑first‑variant, publish success %, API error rates per platform, clickthrough by tag, cost per 100 variants.
* Alerts: connector auth expiry, policy rejection spikes, abnormal CTR drops.

### 4.8 Security & Compliance

* TLS/HSTS/CSP; KMS‑encrypted secrets; signed URLs; Postgres RLS; S3 prefix isolation.
* Least‑privilege tokens for platform APIs; consent and disclosure logging.
* DSR endpoints; retention policies; immutable `audit_log`.

---

## 5) Frontend Architecture (React 18 + Next.js 14)

### 5.1 Tech Choices

* **UI:** Ant Design (Layout, Tabs, Card, Table, Form, Drawer, Modal, Steps) + Tailwind for layout utility.
* **Editor:** Monaco for prompts; rich editor with per‑platform linting (limits, breaks).
* **State/Data:** TanStack Query; Zustand for editor/preview state; URL‑synced filters.
* **Charts:** Recharts; virtualized tables for metrics.
* **Realtime:** WS client; SSE fallback.
* **i18n/A11y:** next‑intl; ARIA labels; keyboard‑first.

### 5.2 App Structure

```
/app
  /(marketing)/page.tsx
  /(auth)/sign-in/page.tsx
  /(app)/dashboard/page.tsx
  /(app)/brands/page.tsx
  /(app)/campaigns/[campaignId]/page.tsx
  /(app)/briefs/[briefId]/page.tsx
  /(app)/posts/[postId]/page.tsx
  /(app)/calendar/page.tsx
  /(app)/assets/page.tsx
  /(app)/experiments/page.tsx
  /(app)/analytics/page.tsx
  /(app)/connectors/page.tsx
/components
  BriefWizard/*
  VoiceTrainer/*
  VariantTable/*
  PlatformPreview/*   // X, LinkedIn, Instagram, TikTok, YouTube renderers
  HashtagMiner/*
  UTMBuild/*
  Calendar/*
  PublishPanel/*
  Experimenter/*
  MetricsDash/*
  Comments/*
/lib
  api-client.ts
  ws-client.ts
  zod-schemas.ts
  rbac.ts
/store
  useBriefStore.ts
  useEditorStore.ts
  usePreviewStore.ts
  useFilterStore.ts
```

### 5.3 Key Pages & UX Flows

**Brief Wizard**

* Topic, audience, tone, objective, platforms; upload brand examples; pick languages/regions; generate.

**Editor & Previews**

* Variants table with scoring; click to open editor; side‑by‑side platform previews; live policy lints (length, banned phrases).
* Hashtag suggestions and rank; link builder with UTM presets.

**Calendar**

* Drag‑drop posts to slots; best‑time hints; bulk reschedule for region time zones; approval states.

**Experiments**

* Select variants; split percentage; start/stop; view results and significance hints.

**Analytics**

* Campaign dashboard; CTR/engagement by platform; hashtag and hook performance; export CSV.

**Connectors**

* OAuth setup; check permissions and token expiry; test publish.

### 5.4 Component Breakdown (Selected)

* **PlatformPreview/X.tsx**
  Props: `{ content, hashtags, link }`
  Renders X‑style card with char counter and truncation rules.

* **VariantTable/Row\.tsx**
  Props: `{ variant, scores, onApprove }`
  Shows readability/brand/risk; approve to schedule or send to review.

* **Calendar/Slot.tsx**
  Props: `{ datetime, post, onDrop }`
  Validates connector availability and posting window.

* **Experimenter/Setup.tsx**
  Props: `{ post, variants }`
  Enforces unique variant per slot and split.

### 5.5 Data Fetching & Caching

* Server components for campaign/brief snapshots.
* TanStack Query with background refetch for metrics; optimistic updates on edits/scheduling.
* Prefetch: brands → campaign → brief → posts → analytics.

### 5.6 Validation & Error Handling

* Zod schemas; Problem+JSON viewer; per‑platform lints (limits, link rules).
* Guards: publishing blocked if not approved; experiments require ≥2 variants and connectors enabled.

### 5.7 Accessibility & i18n

* Keyboard navigation and focus rings; screen‑reader messages for length/risk lints; localized dates/numbers; RTL.

---

## 6) SDKs & Integration Contracts

**Generate Posts**

```http
POST /v1/posts/generate
{"brief_id":"brf_123"}
```

**Rewrite Variant**

```http
POST /v1/variants/var_456/rewrite
{"ops":["shorten","add_hashtag","add_question"]}
```

**Schedule & Publish**

```http
POST /v1/posts/post_123/schedule {"datetime":"2025-08-28T09:00:00","timezone":"Europe/Stockholm"}
POST /v1/posts/post_123/publish
```

**Metrics Ingest (webhook)**

```json
{"post_id":"post_123","platform":"x","ts":"2025-08-28T10:00:00Z","likes":120,"comments":18,"impressions":8200,"clicks":340}
```

**Bundle JSON** keys: `brand`, `campaign`, `brief`, `posts[]`, `variants[]`, `assets[]`, `experiments[]`, `metrics[]`.

---

## 7) DevOps & Deployment

* **FE:** Vercel (Next.js).
* **APIs/Workers:** Render/Fly/GKE with separate pools (gen, policy, publish, metrics).
* **DB:** Managed Postgres + pgvector; PITR; replicas.
* **Cache/Bus:** Redis + NATS; DLQ; retries/backoff with jitter.
* **Storage:** S3/R2; CDN for previews.
* **CI/CD:** GitHub Actions (lint/typecheck/unit/integration, Docker, scan, sign, deploy); blue/green; migration approvals.
* **IaC:** Terraform modules for DB/Redis/NATS/buckets/CDN/secrets/DNS.
* **Envs:** dev/staging/prod; region pinning; error budgets/alerts.

**Operational SLOs**

* Time‑to‑first variant **< 6 s p95** from generate.
* Publish success **≥ 99%** excl. platform outages.
* Metrics ingest lag **< 2 min p95**.
* 5xx **< 0.5%/1k**.

---

## 8) Testing

* **Unit:** platform limit lints; hashtag ranking; link UTM builder; policy phrase detection.
* **Integration:** brief → generate → rewrite → schedule → publish; connector auth refresh; metrics ingest.
* **Regression:** brand voice adherence; forbidden phrase suites; multi‑lingual correctness.
* **E2E (Playwright):** create campaign → run brief wizard → generate multi‑platform variants → schedule → publish (sandbox) → analyze.
* **Load:** batch generation and publish bursts; connector rate‑limit handling.
* **Chaos:** connector API 429/5xx; token expiry; image generation delay; ensure retries/degradation.
* **Security:** RLS coverage; signed URL expiry; audit completeness.

---

## 9) Success Criteria

**Product KPIs**

* Content throughput: **≥ 50** approved posts/user/week.
* CTR lift **≥ 20%** vs baseline copy after 2 weeks for active campaigns.
* Time‑to‑schedule **≤ 15 min** from brief to calendar for 5‑platform campaigns.
* User retention (week 4) **≥ 40%** for teams.

**Engineering SLOs**

* Generation pipeline success **≥ 99%**; publish failure rate **< 1%**; metrics completeness **≥ 98%**.

---

## 10) Visual/Logical Flows

**A) Brief → Generate**
Enter topic/audience/tone/objective → select platforms/languages → train/apply brand voice → generate variants.

**B) Review → Edit**
Compare variants → tweak tone/length/hashtags → compliance check passes.

**C) Schedule → Publish**
Drag to calendar slots → approval flow → publish via connectors/Buffer fallback.

**D) Measure → Iterate**
Ingest metrics → analyze hook/CTA/hashtag → A/B winning variant → regenerate and reschedule.
