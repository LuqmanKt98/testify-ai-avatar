const express = require('express');
const router = express.Router();
const heygenService = require('../services/heygenService');

/**
 * Debug endpoint to diagnose knowledge base issues
 * GET /api/heygen/debug/knowledge-bases
 */
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

