import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRequest, AnalysisResponse, SessionReportData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { transcript, durationSeconds } = body;

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transcript is required',
        } as AnalysisResponse,
        { status: 400 }
      );
    }

    console.log('📊 Next.js Analysis API: Forwarding to backend...');
    console.log(`   Transcript entries: ${transcript.length}`);
    console.log(`   Duration: ${durationSeconds}s`);

    // Call the backend analysis API (same as Flutter app does)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${backendUrl}/api/analysis/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        sessionDuration: durationSeconds,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('❌ Backend analysis failed:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Backend analysis failed',
        } as AnalysisResponse,
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();
    console.log('✅ Backend analysis successful');

    if (!backendData.success || !backendData.analysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response from backend',
        } as AnalysisResponse,
        { status: 500 }
      );
    }

    // Convert backend response format to Next.js format
    const analysis = backendData.analysis;
    const report: SessionReportData = {
      overallScore: Math.round(
        (analysis.accuracy + analysis.clarity + analysis.consistency + analysis.completeness) / 4
      ),
      metrics: {
        accuracy: analysis.accuracy,
        clarity: analysis.clarity,
        tone: analysis.consistency, // Map consistency to tone
        pace: analysis.completeness, // Map completeness to pace
      },
      highlights: analysis.highlights || [],
      recommendations: analysis.recommendations || [],
      durationSeconds,
      summary: analysis.summary || '',
      flaggedSegments: (analysis.flaggedSegments || []).map((segment: any) => ({
        reason: segment.reason || segment.title || 'Flagged',
        text: segment.snippet || segment.text || '',
        timestamp: segment.timestamp || new Date().toISOString(),
        time: segment.time || '00:00',
        title: segment.title || segment.reason || 'Flagged',
        snippet: segment.snippet || segment.text || '',
      })),
    };

    console.log('📊 Analysis report generated:');
    console.log(`   Overall Score: ${report.overallScore}`);
    console.log(`   Accuracy: ${report.metrics.accuracy}`);
    console.log(`   Clarity: ${report.metrics.clarity}`);
    console.log(`   Tone: ${report.metrics.tone}`);
    console.log(`   Pace: ${report.metrics.pace}`);

    return NextResponse.json({
      success: true,
      report,
    } as AnalysisResponse);
  } catch (error: any) {
    console.error('❌ Analysis API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze session',
      } as AnalysisResponse,
      { status: 500 }
    );
  }
}

