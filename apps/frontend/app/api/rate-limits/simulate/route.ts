import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, config, requests } = body;

    if (!key || !config || !requests) {
      return NextResponse.json(
        { error: 'Missing required parameters: key, config, requests' },
        { status: 400 }
      );
    }

    if (requests > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 requests allowed for simulation' },
        { status: 400 }
      );
    }

    // Simulate rate limiting
    const results = [];
    let successful = 0;
    let blocked = 0;

    for (let i = 0; i < requests; i++) {
      const current = i + 1;
      const allowed = current <= config.maxRequests;
      
      const result = {
        allowed,
        current: Math.min(current, config.maxRequests),
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - current),
        reset: Math.ceil((Date.now() + config.windowMs) / 1000),
        retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
      };

      results.push(result);

      if (allowed) {
        successful++;
      } else {
        blocked++;
      }
    }

    const mockResponse = {
      successful,
      blocked,
      results,
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error running rate limit simulation:', error);
    return NextResponse.json(
      { error: 'Failed to run rate limit simulation' },
      { status: 500 }
    );
  }
}
