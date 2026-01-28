import { NextResponse, NextRequest } from 'next/server';
import { getPaste } from '@/lib/redis';

/**
 * GET /api/pastes/:id
 * 
 * Retrieve a paste by ID, decrementing view count atomically.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Get paste and decrement views
    const paste = await getPaste(id);

    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found or expired' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.json(paste, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error retrieving paste:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
