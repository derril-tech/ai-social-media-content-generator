import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    
    // Mock rate limit health status
    const mockHealth = {
      organizationId,
      status: 'warning' as const, // 'healthy' | 'warning' | 'critical'
      activeLimits: 8,
      nearLimit: 2,
      atLimit: 0,
      recommendations: [
        'Rate limit approaching limit for rate_limit:organization:/api/generate:org:123 (70.0%)',
        'Rate limit approaching limit for rate_limit:organization:/api/publish:org:123 (60.0%)',
        'Consider implementing request queuing for high-traffic periods',
        'Monitor burst control tokens for publish operations',
      ],
    };

    return NextResponse.json(mockHealth);
  } catch (error) {
    console.error('Error fetching rate limit health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limit health' },
      { status: 500 }
    );
  }
}
