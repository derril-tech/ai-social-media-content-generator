import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, code } = body;

    // Validate required fields
    if (!platform || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, code' },
        { status: 400 }
      );
    }

    // In a real app, this would call the NestJS API to exchange the code for tokens
    // For now, return mock response
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    return NextResponse.json({
      success: true,
      message: `OAuth authentication successful for ${platform}`,
      details: {
        platform,
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        accountName: `test_${platform}_user`
      }
    });
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.json(
      { error: 'Failed to process OAuth callback' },
      { status: 500 }
    );
  }
}
