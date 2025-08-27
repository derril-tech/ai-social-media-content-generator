import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    
    // Mock rate limit statistics
    const mockStats = {
      organizationId,
      totalKeys: 8,
      activeLimits: [
        {
          key: 'rate_limit:organization:/api/generate:org:123',
          current: 7,
          limit: 10,
          remaining: 3,
          reset: Math.ceil((Date.now() + 60000) / 1000),
        },
        {
          key: 'rate_limit:organization:/api/publish:org:123',
          current: 3,
          limit: 5,
          remaining: 2,
          reset: Math.ceil((Date.now() + 60000) / 1000),
        },
        {
          key: 'rate_limit:organization:/api/connectors:org:123',
          current: 15,
          limit: 20,
          remaining: 5,
          reset: Math.ceil((Date.now() + 60000) / 1000),
        },
        {
          key: 'rate_limit:channel:/api/publish/twitter:org:123:channel:456',
          current: 20,
          limit: 25,
          remaining: 5,
          reset: Math.ceil((Date.now() + 15 * 60 * 1000) / 1000),
        },
        {
          key: 'rate_limit:channel:/api/publish/linkedin:org:123:channel:789',
          current: 85,
          limit: 100,
          remaining: 15,
          reset: Math.ceil((Date.now() + 60 * 60 * 1000) / 1000),
        },
        {
          key: 'rate_limit:user:/api/auth:user:abc123',
          current: 2,
          limit: 5,
          remaining: 3,
          reset: Math.ceil((Date.now() + 15 * 60 * 1000) / 1000),
        },
        {
          key: 'burst:publish:org:123',
          current: 8,
          limit: 10,
          remaining: 2,
          reset: Math.ceil((Date.now() + 5 * 1000) / 1000),
        },
        {
          key: 'burst:generate:org:123',
          current: 18,
          limit: 20,
          remaining: 2,
          reset: Math.ceil((Date.now() + 10 * 1000) / 1000),
        },
      ],
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error fetching rate limit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limit stats' },
      { status: 500 }
    );
  }
}
