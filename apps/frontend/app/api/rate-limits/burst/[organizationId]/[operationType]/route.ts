import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string; operationType: string } }
) {
  try {
    const { organizationId, operationType } = params;
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    // Mock burst control status based on operation type
    let mockBurstStatus;
    
    if (operationType === 'publish') {
      mockBurstStatus = {
        operationType,
        organizationId,
        channelId,
        config: {
          maxBurst: 50,
          burstWindowMs: 5 * 1000,
          recoveryRate: 1,
          bucketSize: 10,
        },
        currentTokens: 8.5,
        lastRefill: Date.now() - 1500, // 1.5 seconds ago
        timeToNextToken: 0.5, // 0.5 seconds until next token
      };
    } else if (operationType === 'generate') {
      mockBurstStatus = {
        operationType,
        organizationId,
        channelId,
        config: {
          maxBurst: 100,
          burstWindowMs: 10 * 1000,
          recoveryRate: 2,
          bucketSize: 20,
        },
        currentTokens: 18.2,
        lastRefill: Date.now() - 900, // 0.9 seconds ago
        timeToNextToken: 0, // No wait time
      };
    } else {
      // Default burst status
      mockBurstStatus = {
        operationType,
        organizationId,
        channelId,
        config: {
          maxBurst: 30,
          burstWindowMs: 5 * 1000,
          recoveryRate: 1,
          bucketSize: 15,
        },
        currentTokens: 12.7,
        lastRefill: Date.now() - 1300, // 1.3 seconds ago
        timeToNextToken: 0, // No wait time
      };
    }

    return NextResponse.json(mockBurstStatus);
  } catch (error) {
    console.error('Error fetching burst control status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch burst control status' },
      { status: 500 }
    );
  }
}
