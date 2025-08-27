import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string; shareLinkId: string } }
) {
  try {
    const { organizationId, shareLinkId } = params;
    
    // Mock share link statistics
    const mockStats = {
      totalViews: 45,
      uniqueVisitors: 23,
      downloads: 8,
      comments: 3,
      lastAccessed: new Date('2024-12-19T10:30:00Z'),
      topReferrers: [
        { referrer: 'Direct', count: 15 },
        { referrer: 'Email', count: 12 },
        { referrer: 'Slack', count: 8 },
        { referrer: 'LinkedIn', count: 6 },
        { referrer: 'Twitter', count: 4 },
      ],
      accessByCountry: [
        { country: 'United States', count: 25 },
        { country: 'Canada', count: 8 },
        { country: 'United Kingdom', count: 6 },
        { country: 'Germany', count: 3 },
        { country: 'Australia', count: 3 },
      ],
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error fetching share link stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share link statistics' },
      { status: 500 }
    );
  }
}
