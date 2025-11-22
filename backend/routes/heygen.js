const express = require('express');
const router = express.Router();
const heygenService = require('../services/heygenService');

// Start a new HeyGen session
router.post('/session/start', async (req, res) => {
  try {
    const { avatarId, voice, quality, knowledgeId, language } = req.body;

    console.log('🎭 Starting HeyGen session...');
    if (knowledgeId) {
      console.log('📚 Using Knowledge Base ID:', knowledgeId);
    }
    if (language) {
      console.log('🌍 Using language:', language);
    }

    const sessionData = await heygenService.startSession(avatarId, voice, quality, knowledgeId, language);

    console.log('📊 Session data received:', JSON.stringify(sessionData, null, 2));

    if (sessionData) {
      const response = {
        success: true,
        data: sessionData,
        timestamp: new Date().toISOString()
      };
      console.log('✅ Sending success response:', JSON.stringify(response, null, 2));
      res.json(response);
    } else {
      console.log('❌ Session data is null, sending error response');
      res.status(500).json({
        success: false,
        error: 'Failed to start HeyGen session'
      });
    }

  } catch (error) {
    console.error('HeyGen session start error:', error);
    res.status(500).json({
      error: 'Failed to start HeyGen session',
      message: error.message
    });
  }
});

// Start streaming for a session
router.post('/session/:sessionId/start-streaming', async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('🎭 Starting streaming for session:', sessionId);
    
    const result = await heygenService.startStreaming(sessionId);
    
    if (result) {
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to start streaming'
      });
    }

  } catch (error) {
    console.error('HeyGen streaming start error:', error);
    res.status(500).json({ 
      error: 'Failed to start streaming',
      message: error.message 
    });
  }
});

// Send chat message to avatar (uses Knowledge Base AI)
router.post('/chat', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Text is required and must be a string' 
      });
    }

    console.log('💬 HeyGen chat request:', text);
    
    const result = await heygenService.sendChatMessage(text);
    
    const duration_ms = result?.data?.duration_ms || 0;
    
    res.json({
      success: result ? true : false,
      duration_ms: duration_ms,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('HeyGen chat error:', error);
    res.status(500).json({ 
      error: 'Failed to send chat message',
      message: error.message 
    });
  }
});

// Make the avatar speak (without KB - just repeats text)
router.post('/speak', async (req, res) => {
  try {
    const { sessionId, text } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'Session ID is required and must be a string'
      });
    }

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text is required and must be a string'
      });
    }

    console.log('🎭 HeyGen speak request:', text);
    console.log('📋 Session ID:', sessionId);

    const result = await heygenService.speak(text, sessionId);

    // The speak method returns the full response from HeyGen
    // Extract duration_ms if available
    const duration_ms = result?.data?.duration_ms || 0;

    res.json({
      success: result ? true : false,
      duration_ms: duration_ms,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('HeyGen speak error:', error);
    res.status(500).json({
      error: 'Failed to make avatar speak',
      message: error.message
    });
  }
});

// Interrupt avatar speech
router.post('/interrupt', async (req, res) => {
  try {
    console.log('⏹️ [INTERRUPT] Interrupt request received at backend');
    console.log('⏹️ [INTERRUPT] Request body:', req.body);
    console.log('⏹️ [INTERRUPT] Calling heygenService.interruptSpeech()...');

    const result = await heygenService.interruptSpeech();

    console.log('⏹️ [INTERRUPT] interruptSpeech() returned:', result);
    console.log('⏹️ [INTERRUPT] Sending response: success=' + result);

    res.json({
      success: result ? true : false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [INTERRUPT] HeyGen interrupt error:', error);
    res.status(500).json({
      error: 'Failed to interrupt avatar',
      message: error.message
    });
  }
});

// End HeyGen session
router.post('/session/end', async (req, res) => {
  try {
    console.log('🎭 Ending HeyGen session...');

    const success = await heygenService.endSession();

    res.json({
      success: success,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('HeyGen session end error:', error);
    res.status(500).json({
      error: 'Failed to end HeyGen session',
      message: error.message
    });
  }
});

// Get HeyGen session status
router.get('/session/status', (req, res) => {
  const sessionInfo = heygenService.getSessionInfo();
  
  res.json({
    configured: heygenService.isConfigured(),
    sessionInfo: sessionInfo,
    timestamp: new Date().toISOString()
  });
});

// Handle WebRTC offer from frontend
router.post('/webrtc/offer', async (req, res) => {
  try {
    const { session_id, offer } = req.body;

    if (!session_id || !offer) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and offer are required'
      });
    }

    console.log('🎭 Handling WebRTC offer for session:', session_id);
    
    // For now, we'll just acknowledge the offer
    // In a real implementation, you'd process the offer and return an answer
    res.json({
      success: true,
      answer: {
        type: 'answer',
        sdp: 'dummy-sdp-answer' // This would be a real SDP answer
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('HeyGen WebRTC offer error:', error);
    res.status(500).json({ 
      error: 'Failed to handle WebRTC offer',
      message: error.message 
    });
  }
});

// Check HeyGen configuration status
router.get('/status', (req, res) => {
  res.json({
    configured: heygenService.isConfigured(),
    baseUrl: process.env.HEYGEN_BASE_URL || 'https://api.heygen.com',
    defaultAvatarId: process.env.HEYGEN_AVATAR_ID,
    defaultVoice: process.env.HEYGEN_DEFAULT_VOICE
  });
});

// ==================== KNOWLEDGE BASE ROUTES ====================

// Create a new Knowledge Base
router.post('/knowledge-base/create', async (req, res) => {
  try {
    const { name, opening, prompt } = req.body;

    if (!name || !opening || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, opening, and prompt are required'
      });
    }

    console.log('📚 Creating Knowledge Base:', name);

    const result = await heygenService.createKnowledgeBase(name, opening, prompt);

    if (result && result.knowledgeId) {
      console.log('✅ KB creation successful, returning to client');
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ KB creation returned no knowledgeId:', result);
      res.status(500).json({
        success: false,
        error: 'Failed to create Knowledge Base - no ID returned'
      });
    }

  } catch (error) {
    console.error('❌ Knowledge Base creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Knowledge Base',
      message: error.message
    });
  }
});

// Update an existing Knowledge Base
router.put('/knowledge-base/:knowledgeId', async (req, res) => {
  try {
    const { knowledgeId } = req.params;
    const { name, opening, prompt } = req.body;

    if (!name || !opening || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, opening, and prompt are required'
      });
    }

    console.log('📚 Updating Knowledge Base:', knowledgeId);

    const success = await heygenService.updateKnowledgeBase(knowledgeId, name, opening, prompt);

    if (success) {
      res.json({
        success: true,
        message: 'Knowledge Base updated successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update Knowledge Base'
      });
    }

  } catch (error) {
    console.error('Knowledge Base update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Knowledge Base',
      message: error.message
    });
  }
});

// List all Knowledge Bases
router.get('/knowledge-base/list', async (req, res) => {
  try {
    console.log('📚 [ROUTE] Listing Knowledge Bases...');

    const knowledgeBases = await heygenService.listKnowledgeBases();

    console.log('📚 [ROUTE] Result:', knowledgeBases);

    if (knowledgeBases !== null && Array.isArray(knowledgeBases)) {
      console.log('📚 [ROUTE] Success! Found', knowledgeBases.length, 'KBs');
      res.json({
        success: true,
        data: knowledgeBases,
        count: knowledgeBases.length,
        timestamp: new Date().toISOString()
      });
    } else if (knowledgeBases === null) {
      console.error('📚 [ROUTE] Service returned null');
      res.status(500).json({
        success: false,
        error: 'Failed to list Knowledge Bases - service returned null',
        details: 'Check backend logs for HeyGen API errors'
      });
    } else {
      console.error('📚 [ROUTE] Invalid response type:', typeof knowledgeBases);
      res.status(500).json({
        success: false,
        error: 'Failed to list Knowledge Bases - invalid response',
        details: 'Response is not an array'
      });
    }

  } catch (error) {
    console.error('❌ [ROUTE] Knowledge Base list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list Knowledge Bases',
      message: error.message,
      details: 'Check backend logs for more information'
    });
  }
});

// Get a specific Knowledge Base
router.get('/knowledge-base/:knowledgeId', async (req, res) => {
  try {
    const { knowledgeId } = req.params;

    console.log('📚 Getting Knowledge Base:', knowledgeId);

    const knowledgeBase = await heygenService.getKnowledgeBase(knowledgeId);

    if (knowledgeBase) {
      res.json({
        success: true,
        data: knowledgeBase,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Knowledge Base not found'
      });
    }

  } catch (error) {
    console.error('Knowledge Base get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Knowledge Base',
      message: error.message
    });
  }
});

// Delete a Knowledge Base
router.delete('/knowledge-base/:knowledgeId', async (req, res) => {
  try {
    const { knowledgeId } = req.params;

    console.log('📚 Deleting Knowledge Base:', knowledgeId);

    const success = await heygenService.deleteKnowledgeBase(knowledgeId);

    if (success) {
      res.json({
        success: true,
        message: 'Knowledge Base deleted successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete Knowledge Base'
      });
    }

  } catch (error) {
    console.error('Knowledge Base delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Knowledge Base',
      message: error.message
    });
  }
});

// ==================== DEBUG ENDPOINT ====================

// Debug endpoint to diagnose knowledge base issues
router.get('/debug/knowledge-bases', async (req, res) => {
  try {
    console.log('\n🔍 ========== KNOWLEDGE BASE DEBUG ==========');

    // Check 1: API Key
    console.log('\n1️⃣ Checking API Key...');
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      console.error('❌ HEYGEN_API_KEY is not set in environment');
      return res.status(400).json({
        success: false,
        error: 'HEYGEN_API_KEY not configured',
        checks: {
          apiKey: 'NOT SET'
        }
      });
    }
    console.log('✅ API Key is set:', apiKey.substring(0, 10) + '...');

    // Check 2: Base URL
    console.log('\n2️⃣ Checking Base URL...');
    const baseUrl = process.env.HEYGEN_BASE_URL || 'https://api.heygen.com';
    console.log('✅ Base URL:', baseUrl);

    // Check 3: Service Configuration
    console.log('\n3️⃣ Checking HeyGen Service...');
    console.log('✅ Service configured:', heygenService.isConfigured());

    // Check 4: Attempt to list knowledge bases
    console.log('\n4️⃣ Attempting to fetch knowledge bases...');
    const knowledgeBases = await heygenService.listKnowledgeBases();

    console.log('\n5️⃣ Result:');
    if (knowledgeBases === null) {
      console.error('❌ Service returned null');
      return res.status(500).json({
        success: false,
        error: 'Service returned null',
        checks: {
          apiKey: 'SET',
          baseUrl: baseUrl,
          serviceConfigured: heygenService.isConfigured(),
          result: 'NULL'
        },
        message: 'Check backend logs for detailed error'
      });
    }

    if (!Array.isArray(knowledgeBases)) {
      console.error('❌ Result is not an array:', typeof knowledgeBases);
      return res.status(500).json({
        success: false,
        error: 'Invalid response type',
        checks: {
          apiKey: 'SET',
          baseUrl: baseUrl,
          serviceConfigured: heygenService.isConfigured(),
          resultType: typeof knowledgeBases
        }
      });
    }

    console.log(`✅ Found ${knowledgeBases.length} knowledge bases`);

    return res.json({
      success: true,
      checks: {
        apiKey: 'SET',
        baseUrl: baseUrl,
        serviceConfigured: heygenService.isConfigured(),
        resultType: 'array',
        count: knowledgeBases.length
      },
      data: knowledgeBases,
      message: 'All checks passed!'
    });

  } catch (error) {
    console.error('\n❌ Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug check failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
