import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In a real app, this would call the NestJS API
    // For now, return mock data
    const mockDetailedStatus = [
      {
        id: 'twitter-1',
        platform: 'twitter',
        name: 'X (Twitter)',
        status: 'connected',
        lastSync: new Date(Date.now() - 3600000).toISOString(),
        nextSync: new Date(Date.now() + 3600000).toISOString(),
        syncProgress: 100,
        errorCount: 0,
        successRate: 98,
        accountName: 'testuser',
        rateLimitRemaining: 85,
        rateLimitReset: new Date(Date.now() + 3600000).toISOString(),
        lastError: null,
        healthScore: 95
      },
      {
        id: 'linkedin-1',
        platform: 'linkedin',
        name: 'LinkedIn',
        status: 'error',
        lastSync: new Date(Date.now() - 7200000).toISOString(),
        nextSync: new Date(Date.now() + 3600000).toISOString(),
        syncProgress: 0,
        errorCount: 3,
        successRate: 85,
        accountName: 'testcompany',
        rateLimitRemaining: 100,
        rateLimitReset: new Date(Date.now() + 3600000).toISOString(),
        lastError: 'Invalid access token',
        healthScore: 65
      },
      {
        id: 'facebook-1',
        platform: 'facebook',
        name: 'Facebook',
        status: 'rate_limited',
        lastSync: new Date(Date.now() - 1800000).toISOString(),
        nextSync: new Date(Date.now() + 1800000).toISOString(),
        syncProgress: 0,
        errorCount: 1,
        successRate: 92,
        accountName: 'testpage',
        rateLimitRemaining: 5,
        rateLimitReset: new Date(Date.now() + 1800000).toISOString(),
        lastError: 'Rate limit exceeded',
        healthScore: 75
      }
    ];

    return NextResponse.json(mockDetailedStatus);
  } catch (error) {
    console.error('Error fetching detailed connector status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detailed connector status' },
      { status: 500 }
    );
  }
}
