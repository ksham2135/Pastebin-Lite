import { NextResponse, NextRequest } from 'next/server';
import { getPasteAndIncrement, pasteToResponse } from '@/lib/paste';

/**
 * GET /api/pastes/:id
 * 
 * Retrieve a paste by ID, incrementing view count atomically.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Get paste and increment views atomically
    const paste = await getPasteAndIncrement(id, request);

    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found or expired' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = pasteToResponse(paste);

    return NextResponse.json(response, {
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
