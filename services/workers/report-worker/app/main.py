from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import os
import json
from nats.aio.client import Client as NATS
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import csv
import io


class ReportRequest(BaseModel):
    request_id: str
    campaign_id: str
    format: str  # pdf, csv, json
    metrics: dict


class ReportResponse(BaseModel):
    request_id: str
    report_url: str


app = FastAPI(title="Report Worker", version="0.1.0")


@app.get('/health')
async def health():
    return {"status": "ok", "service": "report-worker"}


def generate_pdf_report(metrics: dict) -> bytes:
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.drawString(100, 750, "Campaign Report")
    p.drawString(100, 700, f"Total Impressions: {metrics.get('impressions', 0)}")
    p.drawString(100, 680, f"Total Clicks: {metrics.get('clicks', 0)}")
    p.drawString(100, 660, f"CTR: {metrics.get('ctr', 0):.2%}")
    p.showPage()
    p.save()
    return buffer.getvalue()


def generate_csv_report(metrics: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['Impressions', metrics.get('impressions', 0)])
    writer.writerow(['Clicks', metrics.get('clicks', 0)])
    writer.writerow(['CTR', f"{metrics.get('ctr', 0):.2%}"])
    return output.getvalue()


async def start_nats_loop():
    nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
    nc = NATS()
    await nc.connect(servers=[nats_url])

    async def handle_request(msg):
        payload = json.loads(msg.data.decode())
        req = ReportRequest(**payload)
        
        if req.format == 'pdf':
            report_data = generate_pdf_report(req.metrics)
            report_url = f"/reports/{req.campaign_id}.pdf"
        elif req.format == 'csv':
            report_data = generate_csv_report(req.metrics)
            report_url = f"/reports/{req.campaign_id}.csv"
        else:  # json
            report_data = json.dumps(req.metrics, indent=2)
            report_url = f"/reports/{req.campaign_id}.json"
        
        resp = ReportResponse(request_id=req.request_id, report_url=report_url)
        await nc.publish('report.complete', json.dumps(resp.model_dump()).encode())

    await nc.subscribe('report.generate', cb=handle_request)
    while True:
        await asyncio.sleep(3600)


@app.on_event('startup')
async def on_startup():
    asyncio.create_task(start_nats_loop())
