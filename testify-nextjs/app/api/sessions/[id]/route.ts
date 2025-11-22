import { NextRequest, NextResponse } from 'next/server';
import { Session } from '@/types';
import { sessions } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Looking for session:', id);
    console.log('📊 Total sessions in storage:', sessions.size);
    console.log('🗂️ All session IDs:', Array.from(sessions.keys()));

    const session = sessions.get(id);

    if (!session) {
      console.error('❌ Session not found:', id);
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    console.log('✅ Session found:', session);
    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('Session get error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get session',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = sessions.get(id);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updatedSession = { ...session, ...body };
    sessions.set(id, updatedSession);

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error: any) {
    console.error('Session update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update session',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = sessions.delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error: any) {
    console.error('Session delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete session',
      },
      { status: 500 }
    );
  }
}

