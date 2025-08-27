import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    
    // Mock current usage data
    const mockCurrentUsage = {
      organizationId,
      currentUsage: {
        seats: 3,
        generations: 150,
        publishes: 50,
        storageGB: 25,
      },
      lastUpdated: new Date(),
    };

    return NextResponse.json(mockCurrentUsage);
  } catch (error) {
    console.error('Error fetching current usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current usage' },
      { status: 500 }
    );
  }
}
