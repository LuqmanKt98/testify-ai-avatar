import { NextRequest, NextResponse } from 'next/server';
import { heygenService } from '@/lib/services/heygen-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { avatarId, quality = 'medium', language, knowledgeId } = body;

    console.log('🎭 HeyGen session start request:', { avatarId, quality, language, knowledgeId });

    const result = await heygenService.createSession(avatarId, quality, knowledgeId, language);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('HeyGen session start error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to start HeyGen session',
      },
      { status: 500 }
    );
  }
}

