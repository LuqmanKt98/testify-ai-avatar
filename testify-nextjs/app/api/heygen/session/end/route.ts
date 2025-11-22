import { NextRequest, NextResponse } from 'next/server';
import { heygenService } from '@/lib/services/heygen-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required',
        },
        { status: 400 }
      );
    }

    const result = await heygenService.stopSession(sessionId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('HeyGen end session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to end session',
      },
      { status: 500 }
    );
  }
}

