import { NextRequest, NextResponse } from 'next/server';
import { Session } from '@/types';
import { sessions } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    let userSessions = Array.from(sessions.values());
    
    if (userId) {
      userSessions = userSessions.filter((s) => s.userId === userId);
    }

    return NextResponse.json({
      success: true,
      sessions: userSessions,
    });
  } catch (error: any) {
    console.error('Sessions list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list sessions',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, avatarId, quality, language, knowledgeBaseId } = body;

    console.log('📝 Creating session with:', { userId, name, avatarId, quality, language, knowledgeBaseId });

    if (!userId || !name || !avatarId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID, name, and avatar ID are required',
        },
        { status: 400 }
      );
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: Session = {
      id: sessionId,
      userId,
      name,
      avatarId,
      quality: quality || 'medium',
      language: language || 'en-US',
      knowledgeBaseId,
      startTime: new Date().toISOString(),
      transcript: [],
    };

    sessions.set(sessionId, session);
    console.log('✅ Session created:', sessionId);
    console.log('📊 Total sessions in storage:', sessions.size);
    console.log('🗂️ All session IDs:', Array.from(sessions.keys()));

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('Session create error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create session',
      },
      { status: 500 }
    );
  }
}

