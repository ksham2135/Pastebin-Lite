import { NextResponse, NextRequest } from 'next/server';
import { createPaste, PasteCreateRequest } from '@/lib/paste';

/**
 * POST /api/pastes
 * 
 * Create a new paste.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate body is an object
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Request body must be a JSON object' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const req: PasteCreateRequest = body;

    // Validate required field: content
    if (typeof req.content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (req.content.trim() === '') {
      return NextResponse.json(
        { error: 'content must be a non-empty string' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate optional fields
    if (req.ttl_seconds !== undefined) {
      if (!Number.isInteger(req.ttl_seconds) || req.ttl_seconds < 1) {
        return NextResponse.json(
          { error: 'ttl_seconds must be an integer >= 1' },
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.max_views !== undefined) {
      if (!Number.isInteger(req.max_views) || req.max_views < 1) {
        return NextResponse.json(
          { error: 'max_views must be an integer >= 1' },
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create paste
    const paste = await createPaste(req, request);

    // Get the host from request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const url = `${protocol}://${host}/p/${paste.id}`;

    return NextResponse.json(
      {
        id: paste.id,
        url,
      },
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating paste:', error);

    const message =
      error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { error: message },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
