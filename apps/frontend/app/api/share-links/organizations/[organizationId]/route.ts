import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Mock share links data
    const mockShareLinks = [
      {
        id: 'share-1',
        token: 'abc123def456',
        title: 'Q4 Campaign Preview',
        description: 'Preview of our upcoming Q4 marketing campaign',
        type: 'campaign_preview',
        status: 'active',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        maxViews: 50,
        currentViews: 12,
        requirePassword: false,
        allowDownload: true,
        allowComments: true,
        createdAt: new Date('2024-12-15'),
        lastAccessedAt: new Date('2024-12-19'),
        createdBy: 'john.doe@company.com',
        shareUrl: 'http://localhost:3000/share/abc123def456',
      },
      {
        id: 'share-2',
        token: 'xyz789uvw012',
        title: 'Analytics Report - December',
        description: 'Monthly analytics report for December 2024',
        type: 'analytics_report',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxViews: 100,
        currentViews: 8,
        requirePassword: true,
        allowDownload: false,
        allowComments: false,
        createdAt: new Date('2024-12-10'),
        lastAccessedAt: new Date('2024-12-18'),
        createdBy: 'jane.smith@company.com',
        shareUrl: 'http://localhost:3000/share/xyz789uvw012',
      },
      {
        id: 'share-3',
        token: 'mno345pqr678',
        title: 'Content Preview - Blog Post',
        description: 'Preview of upcoming blog post about AI trends',
        type: 'content_preview',
        status: 'expired',
        expiresAt: new Date('2024-12-01'),
        maxViews: 25,
        currentViews: 25,
        requirePassword: false,
        allowDownload: true,
        allowComments: true,
        createdAt: new Date('2024-11-25'),
        lastAccessedAt: new Date('2024-11-30'),
        createdBy: 'john.doe@company.com',
        shareUrl: 'http://localhost:3000/share/mno345pqr678',
      },
      {
        id: 'share-4',
        token: 'stu901vwx234',
        title: 'Billing Report - November',
        description: 'Billing and usage report for November 2024',
        type: 'billing_report',
        status: 'revoked',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        maxViews: 10,
        currentViews: 3,
        requirePassword: true,
        allowDownload: false,
        allowComments: false,
        createdAt: new Date('2024-12-05'),
        lastAccessedAt: new Date('2024-12-12'),
        createdBy: 'jane.smith@company.com',
        shareUrl: 'http://localhost:3000/share/stu901vwx234',
      },
    ];

    // Apply filters
    let filteredLinks = mockShareLinks;

    if (userId) {
      filteredLinks = filteredLinks.filter(link => link.createdBy === userId);
    }

    if (type) {
      filteredLinks = filteredLinks.filter(link => link.type === type);
    }

    if (status) {
      filteredLinks = filteredLinks.filter(link => link.status === status);
    }

    // Apply pagination
    const paginatedLinks = filteredLinks.slice(offset, offset + limit);

    return NextResponse.json({
      shareLinks: paginatedLinks,
      total: filteredLinks.length,
    });
  } catch (error) {
    console.error('Error fetching share links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const body = await request.json();
    
    // Mock response for creating a new share link
    const newShareLink = {
      id: 'share-' + Date.now(),
      token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      title: body.title,
      description: body.description,
      type: body.type,
      status: 'active',
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      maxViews: body.maxViews || 0,
      currentViews: 0,
      requirePassword: body.requirePassword || false,
      allowDownload: body.allowDownload !== false,
      allowComments: body.allowComments || false,
      createdAt: new Date(),
      lastAccessedAt: null,
      createdBy: 'current.user@company.com',
      shareUrl: `http://localhost:3000/share/${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`,
    };

    return NextResponse.json({
      message: 'Share link created successfully',
      shareLink: newShareLink,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
