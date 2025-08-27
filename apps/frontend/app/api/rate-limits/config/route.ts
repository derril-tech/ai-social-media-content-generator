import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock rate limit configuration
    const mockConfig = {
      rules: [
        {
          path: '/api/generate',
          scope: 'organization',
          config: {
            windowMs: 60 * 1000,
            maxRequests: 10,
            burstLimit: 20,
            burstWindowMs: 10 * 1000,
          },
        },
        {
          path: '/api/publish',
          scope: 'organization',
          config: {
            windowMs: 60 * 1000,
            maxRequests: 5,
            burstLimit: 15,
            burstWindowMs: 5 * 1000,
          },
        },
        {
          path: '/api/connectors',
          scope: 'organization',
          config: {
            windowMs: 60 * 1000,
            maxRequests: 20,
            burstLimit: 50,
            burstWindowMs: 10 * 1000,
          },
        },
        {
          path: '/api/publish/twitter',
          scope: 'channel',
          config: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 25,
            burstLimit: 50,
            burstWindowMs: 60 * 1000,
          },
        },
        {
          path: '/api/publish/linkedin',
          scope: 'channel',
          config: {
            windowMs: 60 * 60 * 1000,
            maxRequests: 100,
            burstLimit: 200,
            burstWindowMs: 5 * 60 * 1000,
          },
        },
        {
          path: '/api/publish/facebook',
          scope: 'channel',
          config: {
            windowMs: 60 * 60 * 1000,
            maxRequests: 200,
            burstLimit: 400,
            burstWindowMs: 5 * 60 * 1000,
          },
        },
        {
          path: '/api/publish/instagram',
          scope: 'channel',
          config: {
            windowMs: 60 * 60 * 1000,
            maxRequests: 100,
            burstLimit: 200,
            burstWindowMs: 5 * 60 * 1000,
          },
        },
        {
          path: '/api/auth',
          scope: 'user',
          config: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 5,
            burstLimit: 10,
            burstWindowMs: 60 * 1000,
          },
        },
      ],
      burstConfigs: [
        {
          operationType: 'publish',
          config: {
            maxBurst: 50,
            burstWindowMs: 5 * 1000,
            recoveryRate: 1,
            bucketSize: 10,
          },
        },
        {
          operationType: 'generate',
          config: {
            maxBurst: 100,
            burstWindowMs: 10 * 1000,
            recoveryRate: 2,
            bucketSize: 20,
          },
        },
      ],
    };

    return NextResponse.json(mockConfig);
  } catch (error) {
    console.error('Error fetching rate limit config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limit config' },
      { status: 500 }
    );
  }
}
