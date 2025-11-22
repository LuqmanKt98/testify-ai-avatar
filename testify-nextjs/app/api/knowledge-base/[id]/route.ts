import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeBase } from '@/types';
import { knowledgeBases } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kb = knowledgeBases.get(id);

    if (!kb) {
      return NextResponse.json(
        {
          success: false,
          error: 'Knowledge base not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      knowledgeBase: kb,
    });
  } catch (error: any) {
    console.error('Knowledge base get error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get knowledge base',
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
    const deleted = knowledgeBases.delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Knowledge base not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge base deleted',
    });
  } catch (error: any) {
    console.error('Knowledge base delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete knowledge base',
      },
      { status: 500 }
    );
  }
}

