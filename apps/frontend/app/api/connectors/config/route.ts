import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, clientId, clientSecret, autoSync, syncInterval } = body;

    // Validate required fields
    if (!platform || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, clientId, clientSecret' },
        { status: 400 }
      );
    }

    // In a real app, this would call the NestJS API
    // For now, return mock response
    const mockOAuthUrl = `https://${platform}.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${platform}/callback`)}&scope=read,write&response_type=code&state=mock_state`;

    return NextResponse.json({
      oauthUrl: mockOAuthUrl,
      config: {
        platform,
        clientId,
        autoSync: autoSync ?? true,
        syncInterval: syncInterval ?? 'hourly'
      }
    });
  } catch (error) {
    console.error('Error saving connector config:', error);
    return NextResponse.json(
      { error: 'Failed to save connector configuration' },
      { status: 500 }
    );
  }
}
