import { NextRequest, NextResponse } from 'next/server';
import { ytlIlmuService } from '@/lib/services/ytl-ilmu-service';
import { openaiService } from '@/lib/services/openai-service';
import { LLMRequest, LLMResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LLMRequest = await request.json();
    const {
      message,
      conversationHistory = [],
      knowledgeBaseContent,
      knowledgeBaseId,
      language,
    } = body;

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required',
        } as LLMResponse,
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    // First, try to delegate to the Node.js backend LLM endpoint
    try {
      const backendResponse = await fetch(`${backendUrl}/api/llm/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory,
          knowledgeBaseContent,
          knowledgeBaseId,
          language,
        }),
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();

        if (data && data.success && data.response) {
          return NextResponse.json({
            success: true,
            response: data.response,
            provider: 'backend',
            timestamp: data.timestamp,
          } as LLMResponse);
        }

        return NextResponse.json(
          {
            success: false,
            error: data?.error || 'Backend LLM failed to process message',
          } as LLMResponse,
          { status: backendResponse.status || 502 }
        );
      }

      console.warn(
        'Backend LLM endpoint responded with non-OK status:',
        backendResponse.status
      );
    } catch (backendError: any) {
      console.warn(
        'Failed to reach backend LLM service, falling back to direct LLM integration:',
        backendError?.message || backendError
      );
    }

    // Fallback to direct YTL ILMU, then OpenAI (previous behaviour)
    if (ytlIlmuService.isConfigured()) {
      const result = await ytlIlmuService.processMessage(
        message,
        conversationHistory,
        knowledgeBaseContent
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          response: result.response,
          provider: 'ytl-ilmu',
        } as LLMResponse);
      }

      console.log('YTL ILMU failed, falling back to OpenAI:', result.error);
    }

    if (openaiService.isConfigured()) {
      const result = await openaiService.processMessage(
        message,
        conversationHistory,
        knowledgeBaseContent
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          response: result.response,
          provider: 'openai',
        } as LLMResponse);
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error,
        } as LLMResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'No LLM service configured',
      } as LLMResponse,
      { status: 503 }
    );
  } catch (error: any) {
    console.error('LLM process error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process message',
      } as LLMResponse,
      { status: 500 }
    );
  }
}

