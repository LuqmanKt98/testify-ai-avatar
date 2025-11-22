import { NextRequest, NextResponse } from 'next/server';
import { heygenService } from '@/lib/services/heygen-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, text, taskType = 'talk' } = body;

    if (!sessionId || !text) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID and text are required',
        },
        { status: 400 }
      );
    }

    const result = await heygenService.sendTask(sessionId, text, taskType);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('HeyGen speak error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send speak command',
      },
      { status: 500 }
    );
  }
}

