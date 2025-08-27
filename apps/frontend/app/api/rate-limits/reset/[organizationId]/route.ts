import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    // Mock reset response
    const mockResponse = {
      message: 'Rate limits reset successfully',
      resetKeys: path ? 1 : 8, // If specific path, reset 1 key, otherwise reset all
    };

    // Simulate a small delay to mimic actual reset operation
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error resetting rate limits:', error);
    return NextResponse.json(
      { error: 'Failed to reset rate limits' },
      { status: 500 }
    );
  }
}
