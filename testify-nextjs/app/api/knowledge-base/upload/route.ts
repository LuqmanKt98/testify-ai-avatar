import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeBase } from '@/types';
import { knowledgeBases } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Validate file size (50,000 characters max)
    if (content.length > 50000) {
      return NextResponse.json(
        {
          success: false,
          error: 'File content exceeds 50,000 characters',
        },
        { status: 400 }
      );
    }

    // Create knowledge base entry
    const id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileType = file.name.split('.').pop()?.toLowerCase() as 'txt' | 'pdf' | 'docx';

    const knowledgeBase: KnowledgeBase = {
      id,
      name: file.name,
      content,
      fileType: fileType || 'txt',
      uploadedAt: new Date().toISOString(),
      characterCount: content.length,
    };

    knowledgeBases.set(id, knowledgeBase);

    return NextResponse.json({
      success: true,
      knowledgeBase: {
        id: knowledgeBase.id,
        name: knowledgeBase.name,
        characterCount: knowledgeBase.characterCount,
        uploadedAt: knowledgeBase.uploadedAt,
      },
    });
  } catch (error: any) {
    console.error('Knowledge base upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload knowledge base',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const kbs = Array.from(knowledgeBases.values()).map((kb) => ({
      id: kb.id,
      name: kb.name,
      characterCount: kb.characterCount,
      uploadedAt: kb.uploadedAt,
      fileType: kb.fileType,
    }));

    return NextResponse.json({
      success: true,
      knowledgeBases: kbs,
    });
  } catch (error: any) {
    console.error('Knowledge base list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list knowledge bases',
      },
      { status: 500 }
    );
  }
}

