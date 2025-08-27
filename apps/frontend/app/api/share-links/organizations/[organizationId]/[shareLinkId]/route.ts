import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string; shareLinkId: string } }
) {
  try {
    const { organizationId, shareLinkId } = params;
    const body = await request.json();
    
    // Mock response for updating a share link
    const updatedShareLink = {
      id: shareLinkId,
      token: 'abc123def456',
      title: body.title || 'Updated Share Link',
      description: body.description,
      type: body.type || 'content_preview',
      status: 'active',
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      maxViews: body.maxViews || 0,
      currentViews: 12,
      requirePassword: body.requirePassword || false,
      allowDownload: body.allowDownload !== false,
      allowComments: body.allowComments || false,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      message: 'Share link updated successfully',
      shareLink: updatedShareLink,
    });
  } catch (error) {
    console.error('Error updating share link:', error);
    return NextResponse.json(
      { error: 'Failed to update share link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; shareLinkId: string } }
) {
  try {
    const { organizationId, shareLinkId } = params;
    
    // Mock response for revoking a share link
    return NextResponse.json({
      message: 'Share link revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}
