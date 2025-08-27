import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const method = searchParams.get('method') || 'POST';

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Mock rate limit status based on path
    let mockStatus;
    
    if (path.includes('generate')) {
      mockStatus = {
        organizationId,
        path,
        method,
        current: 7,
        limit: 10,
        remaining: 3,
        reset: Math.ceil((Date.now() + 60000) / 1000),
        burst: {
          current: 18,
          limit: 20,
          remaining: 2,
        },
      };
    } else if (path.includes('publish')) {
      mockStatus = {
        organizationId,
        path,
        method,
        current: 3,
        limit: 5,
        remaining: 2,
        reset: Math.ceil((Date.now() + 60000) / 1000),
        burst: {
          current: 8,
          limit: 15,
          remaining: 7,
        },
      };
    } else if (path.includes('connectors')) {
      mockStatus = {
        organizationId,
        path,
        method,
        current: 15,
        limit: 20,
        remaining: 5,
        reset: Math.ceil((Date.now() + 60000) / 1000),
        burst: {
          current: 45,
          limit: 50,
          remaining: 5,
        },
      };
    } else if (path.includes('auth')) {
      mockStatus = {
        organizationId,
        path,
        method,
        current: 2,
        limit: 5,
        remaining: 3,
        reset: Math.ceil((Date.now() + 15 * 60 * 1000) / 1000),
        burst: {
          current: 8,
          limit: 10,
          remaining: 2,
        },
      };
    } else {
      // Default status
      mockStatus = {
        organizationId,
        path,
        method,
        current: 5,
        limit: 10,
        remaining: 5,
        reset: Math.ceil((Date.now() + 60000) / 1000),
        burst: {
          current: 15,
          limit: 20,
          remaining: 5,
        },
      };
    }

    return NextResponse.json(mockStatus);
  } catch (error) {
    console.error('Error fetching rate limit status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limit status' },
      { status: 500 }
    );
  }
}
