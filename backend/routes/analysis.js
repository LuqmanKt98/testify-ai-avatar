const express = require('express');
const router = express.Router();
const analysisService = require('../services/analysisService');

/**
 * POST /api/analysis/session
 * Analyze a session transcript
 * 
 * Request body:
 * {
 *   transcript: [ {speaker: 'Witness', text: '...', timestamp: '...'}, ... ],
 *   knowledgeBase: 'Optional knowledge base content',
 *   sessionDuration: 180 // seconds, optional
 * }
 */
router.post('/session', async (req, res) => {
  try {
    const { transcript, knowledgeBase, sessionDuration } = req.body;

    // Validate input
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transcript data',
        message: 'Transcript must be a non-empty array'
      });
    }

    console.log('📊 Analysis request received');
    console.log(`   - Transcript messages: ${transcript.length}`);
    console.log(`   - Knowledge base: ${knowledgeBase ? 'Provided' : 'None'}`);
    console.log(`   - Session duration: ${sessionDuration ? `${sessionDuration}s` : 'N/A'}`);

    // Perform analysis
    const startTime = Date.now();
    const analysisResult = await analysisService.analyzeSession(
      transcript,
      knowledgeBase || '',
      { sessionDuration }
    );
    const analysisTime = Date.now() - startTime;

    console.log(`✅ Analysis completed in ${analysisTime}ms`);
    console.log(`   - Accuracy: ${analysisResult.accuracy}%`);
    console.log(`   - Clarity: ${analysisResult.clarity}%`);
    console.log(`   - Completeness: ${analysisResult.completeness}%`);
    console.log(`   - Consistency: ${analysisResult.consistency}%`);

    res.json({
      success: true,
      analysis: analysisResult,
      metadata: {
        analyzedAt: new Date().toISOString(),
        analysisTimeMs: analysisTime,
        transcriptMessageCount: transcript.length,
        hasKnowledgeBase: !!knowledgeBase
      }
    });

  } catch (error) {
    console.error('❌ Analysis endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/analysis/session/:sessionId
 * Analyze a saved session by ID
 */
router.post('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { knowledgeBase } = req.body;

    // Note: In production, you would fetch the session from database
    // For now, this endpoint requires the full transcript to be provided
    res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: 'Session retrieval from database not yet implemented. Use /api/analysis/session with full transcript.'
    });

  } catch (error) {
    console.error('❌ Analysis by ID endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /api/analysis/health
 * Check if analysis service is configured and ready
 */
router.get('/health', (req, res) => {
  const isConfigured = analysisService.isConfigured();
  const activeProvider = analysisService.getActiveProvider();
  
  res.json({
    success: true,
    status: isConfigured ? 'ready' : 'unconfigured',
    message: isConfigured 
      ? `Analysis service is configured and ready using ${activeProvider}`
      : 'No LLM provider configured. Analysis will use fallback mode.',
    activeProvider: activeProvider,
    capabilities: {
      llmAnalysis: isConfigured,
      fallbackAnalysis: true,
      ytlIlmu: activeProvider === 'YTL ILMU',
      openai: activeProvider === 'OpenAI'
    }
  });
});

module.exports = router;

