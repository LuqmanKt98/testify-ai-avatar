import { NextRequest, NextResponse } from 'next/server';
import { heygenService } from '@/lib/services/heygen-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    console.log('🎭 Starting streaming for session:', sessionId);

    const result = await heygenService.startStreaming(sessionId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('HeyGen start streaming error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to start streaming',
        details: error.response?.data || error.toString(),
      },
      { status: 500 }
    );
  }
}

