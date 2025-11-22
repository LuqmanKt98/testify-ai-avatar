const express = require('express');
const router = express.Router();
const openaiService = require('../services/openaiService');
const ytlIlmuService = require('../services/ytlIlmuService');
const heygenService = require('../services/heygenService');

// Process user message with LLM (now using YTL ILMU)
router.post('/process', async (req, res) => {
  try {
    const { message, knowledgeBaseContent, knowledgeBaseId, conversationHistory, language } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    console.log('\n========== LLM REQUEST ==========');
    console.log('📝 Processing LLM request with YTL ILMU:', message);
    console.log('🧾 Raw body:', req.body);
    console.log('📝 Request body summary:', { message, knowledgeBaseId, hasContent: !!knowledgeBaseContent, language });
    if (language) {
      console.log('🌍 Response language:', language);
    }

    // Determine which knowledge base content to use
    let finalKnowledgeBaseContent = knowledgeBaseContent;

    // If knowledge base ID is provided, fetch the knowledge base details from HeyGen
    if (knowledgeBaseId) {
      console.log('📚 Fetching HeyGen Knowledge Base:', knowledgeBaseId);
      try {
        const kbDetails = await heygenService.getKnowledgeBaseDetails(knowledgeBaseId);
        if (kbDetails) {
          // Use the knowledge base prompt as the context for the LLM
          finalKnowledgeBaseContent = kbDetails.prompt || kbDetails.opening || knowledgeBaseContent;
          console.log('✅ Using HeyGen Knowledge Base prompt for avatar response');
          console.log('📚 KB Prompt length:', finalKnowledgeBaseContent ? finalKnowledgeBaseContent.length : 0);
          console.log('📚 KB Prompt preview:', finalKnowledgeBaseContent ? finalKnowledgeBaseContent.substring(0, 200) : 'EMPTY');
        } else {
          console.warn('⚠️ Knowledge base details returned null');
        }
      } catch (kbError) {
        console.warn('⚠️ Failed to fetch knowledge base details:', kbError.message);
        // Fall back to provided content if KB fetch fails
      }
    } else if (knowledgeBaseContent) {
      console.log('📚 Using custom knowledge base content for avatar response');
    } else {
      console.log('⚠️ No knowledge base ID or content provided');
    }
    console.log('========== END REQUEST ==========\n');

    if (conversationHistory && conversationHistory.length > 0) {
      console.log('📜 Conversation history provided:', conversationHistory.length, 'messages');
    }

    // Try YTL ILMU first, fallback to OpenAI if not configured
    let response;

    if (ytlIlmuService.isConfigured()) {
      console.log('🧠 Using YTL ILMU for conversation');
      try {
        response = await ytlIlmuService.processConversation(
          message,
          finalKnowledgeBaseContent,
          conversationHistory || [],
          language
        );
      } catch (ytlError) {
        console.error('⚠️ YTL ILMU failed, falling back to OpenAI:', ytlError.message);
        response = await openaiService.processQuery(
          message,
          finalKnowledgeBaseContent,
          conversationHistory || [],
          language
        );
      }
    } else {
      console.log('🤖 YTL ILMU not configured, using OpenAI');
      response = await openaiService.processQuery(
        message,
        finalKnowledgeBaseContent,
        conversationHistory || [],
        language
      );
    }

    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LLM API Error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      message: error.message
    });
  }
});

// Check LLM configuration status (YTL ILMU + OpenAI fallback)
router.get('/status', (req, res) => {
  const ytlConfigured = ytlIlmuService.isConfigured();
  const openaiConfigured = openaiService.isConfigured();
  
  res.json({
    primary: ytlConfigured ? 'YTL ILMU' : 'OpenAI',
    ytlIlmu: {
      configured: ytlConfigured,
      model: process.env.YTL_ILMU_MODEL || 'ilmu-trial',
      baseUrl: process.env.YTL_ILMU_BASE_URL || 'https://api.ytlailabs.tech'
    },
    openai: {
      configured: openaiConfigured,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      maxTokens: process.env.OPENAI_MAX_TOKENS || 80,
      temperature: process.env.OPENAI_TEMPERATURE || 0.7
    },
    fallbackAvailable: openaiConfigured
  });
});

// Health check for LLM service
router.get('/health', async (req, res) => {
  try {
    const ytlConfigured = ytlIlmuService.isConfigured();
    const openaiConfigured = openaiService.isConfigured();
    
    if (!ytlConfigured && !openaiConfigured) {
      return res.status(503).json({
        status: 'unavailable',
        reason: 'No LLM service configured (neither YTL ILMU nor OpenAI)'
      });
    }

    // Test with the configured service
    let testResponse;
    let serviceName;
    
    if (ytlConfigured) {
      serviceName = 'YTL ILMU';
      testResponse = await ytlIlmuService.processConversation('Hello');
    } else {
      serviceName = 'OpenAI';
      testResponse = await openaiService.processQuery('Hello');
    }
    
    res.json({
      status: 'healthy',
      service: serviceName,
      configured: true,
      testResponse: testResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
