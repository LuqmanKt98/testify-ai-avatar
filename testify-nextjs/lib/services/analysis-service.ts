import { TranscriptEntry, SessionReportData, FlaggedSegment } from '@/types';
import { openaiService } from './openai-service';

export class AnalysisService {
  async analyzeSession(
    transcript: TranscriptEntry[],
    durationSeconds?: number
  ): Promise<{ success: boolean; report?: SessionReportData; error?: string }> {
    try {
      // Build transcript text
      const transcriptText = transcript
        .map((entry) => `[${entry.timestamp}] ${entry.speaker}: ${entry.text}`)
        .join('\n');

      // Create analysis prompt
      const analysisPrompt = `Analyze the following witness interview transcript and provide a detailed performance report.

Transcript:
${transcriptText}

Please analyze the interview and provide:
1. Accuracy score (0-100): How credible and consistent were the responses?
2. Clarity score (0-100): How clear and articulate was the communication?
3. Tone score (0-100): How composed and consistent was the emotional tone?
4. Pace score (0-100): How complete and thorough were the responses?
5. Key highlights (3-5 specific moments with timestamps)
6. Recommendations for improvement (3-5 actionable suggestions)
7. Overall summary of the performance
8. Flagged segments (any problematic moments with timestamps)

IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text.
Your response must be a valid JSON object with this exact structure:
{
  "accuracy": number,
  "clarity": number,
  "tone": number,
  "pace": number,
  "highlights": ["string"],
  "recommendations": ["string"],
  "summary": "string",
  "flaggedSegments": [{"time": "string", "title": "string", "snippet": "string"}]
}`;

      const result = await openaiService.processMessage(analysisPrompt, [], undefined, true);

      if (!result.success || !result.response) {
        return {
          success: false,
          error: result.error || 'Failed to analyze session',
        };
      }

      // Parse the JSON response
      try {
        // Clean the response - remove markdown code blocks if present
        let cleanedResponse = result.response.trim();

        // Remove markdown code blocks (```json ... ``` or ``` ... ```)
        if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        }

        const analysisData = JSON.parse(cleanedResponse);

        const metrics = {
          accuracy: analysisData.accuracy || analysisData.metrics?.accuracy || 75,
          clarity: analysisData.clarity || analysisData.metrics?.clarity || 75,
          tone: analysisData.tone || analysisData.metrics?.tone || 75,
          pace: analysisData.pace || analysisData.metrics?.pace || 75,
        };

        const overallScore = analysisData.overallScore ||
          Math.round((metrics.accuracy + metrics.clarity + metrics.tone + metrics.pace) / 4);

        const report: SessionReportData = {
          overallScore,
          metrics,
          highlights: analysisData.highlights || [],
          recommendations: analysisData.recommendations || [],
          durationSeconds,
          summary: analysisData.summary,
          flaggedSegments: analysisData.flaggedSegments || [],
        };

        return {
          success: true,
          report,
        };
      } catch (parseError) {
        // If JSON parsing fails, create a basic report
        console.error('Failed to parse analysis response:', parseError);

        const defaultMetrics = {
          accuracy: 75,
          clarity: 75,
          tone: 75,
          pace: 75,
        };

        return {
          success: true,
          report: {
            overallScore: 75,
            metrics: defaultMetrics,
            highlights: ['Analysis completed'],
            recommendations: ['Continue practicing interview skills'],
            durationSeconds,
            summary: result.response,
            flaggedSegments: [],
          },
        };
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      return {
        success: false,
        error: error.message || 'Failed to analyze session',
      };
    }
  }

  async generateSampleReport(): Promise<SessionReportData> {
    return {
      overallScore: 85,
      metrics: {
        accuracy: 87,
        clarity: 92,
        tone: 84,
        pace: 78,
      },
      highlights: [
        '00:12 — Clear summary of the objective.',
        '02:45 — Two strong facts cited from the case file.',
        '05:30 — Maintained composure under pressure.',
      ],
      recommendations: [
        'Use concise sentences; reduce filler words.',
        'Pause briefly after key points for emphasis.',
        'Practice maintaining eye contact with the interviewer.',
      ],
      durationSeconds: 365,
      summary: 'Strong performance overall with good clarity and accuracy. Some areas for improvement in pacing and reducing filler words.',
      flaggedSegments: [
        {
          reason: 'Inconsistent Statement',
          text: 'Contradicted earlier statement about timeline',
          timestamp: new Date(Date.now() - 195000).toISOString(), // 3:15 ago
          time: '03:15',
          title: 'Inconsistent Statement',
          snippet: 'Contradicted earlier statement about timeline',
        },
      ],
    };
  }
}

export const analysisService = new AnalysisService();

