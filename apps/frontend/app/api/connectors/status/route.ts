import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In a real app, this would call the NestJS API
    // For now, return mock data
    const mockStatus = {
      twitter: {
        status: 'disconnected',
        lastSync: null,
        accountName: null
      },
      linkedin: {
        status: 'disconnected',
        lastSync: null,
        accountName: null
      },
      facebook: {
        status: 'disconnected',
        lastSync: null,
        accountName: null
      },
      instagram: {
        status: 'disconnected',
        lastSync: null,
        accountName: null
      },
      youtube: {
        status: 'disconnected',
        lastSync: null,
        accountName: null
      },
      tiktok: {
        status: 'disconnected',
        lastSync: null,
        accountName: null
      },
      pinterest: {
        status: 'disconnected',
        lastSync: null,
        accountName: null
      }
    };

    return NextResponse.json(mockStatus);
  } catch (error) {
    console.error('Error fetching connector status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connector status' },
      { status: 500 }
    );
  }
}
