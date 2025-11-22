const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configure multer for audio file uploads
const upload = multer({
  dest: 'uploads/audio/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max (Whisper limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/') || file.originalname.match(/\.(wav|mp3|m4a|webm|mp4)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

/**
 * Transcribe audio with OpenAI Whisper
 * Provides accurate transcription + timing metrics
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('📥 Whisper transcribe endpoint called');
    console.log('Request file:', req.file ? 'Present' : 'Missing');
    console.log('Request body:', req.body);

    if (!req.file) {
      console.error('❌ No audio file provided in request');
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.error('❌ OpenAI API key not configured');
      return res.status(503).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    console.log('🎙️ Transcribing audio with Whisper...');
    console.log('📁 File:', req.file.originalname, 'Size:', req.file.size, 'bytes');
    console.log('📁 File path:', req.file.path);
    console.log('📁 File mimetype:', req.file.mimetype);

    // Verify file exists
    if (!fs.existsSync(req.file.path)) {
      console.error('❌ Uploaded file does not exist at path:', req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Uploaded file not found'
      });
    }

    // Create form data for Whisper API
    const formData = new FormData();
    const fileStream = fs.createReadStream(req.file.path);

    fileStream.on('error', (err) => {
      console.error('❌ Error reading file stream:', err);
    });

    formData.append('file', fileStream, {
      filename: req.file.originalname || 'audio.webm',
      contentType: req.file.mimetype || 'audio/webm',
    });
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json'); // Get timestamps
    formData.append('language', 'en'); // English
    formData.append('temperature', '0'); // More deterministic

    console.log('📤 Sending request to OpenAI Whisper API...');

    // Call OpenAI Whisper API
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000, // 60 seconds
      }
    );

    console.log('✅ OpenAI Whisper API response received, status:', response.status);

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    if (response.status === 200) {
      const data = response.data;

      console.log('✅ Whisper transcription completed');
      console.log('📝 Text:', data.text?.substring(0, 100) + '...');
      console.log('⏱️ Duration:', data.duration, 'seconds');

      // Calculate speech metrics
      const wordCount = data.text ? data.text.trim().split(/\s+/).length : 0;
      const wordsPerMinute = data.duration ? (wordCount / (data.duration / 60)) : 0;

      res.json({
        success: true,
        transcript: data.text,
        language: data.language,
        duration: data.duration,
        segments: data.segments, // Word-level timestamps
        metrics: {
          wordCount: wordCount,
          wordsPerMinute: Math.round(wordsPerMinute),
          duration: data.duration,
        },
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Whisper API error:', response.status);
      res.status(500).json({
        success: false,
        error: 'Whisper transcription failed'
      });
    }

  } catch (error) {
    console.error('❌ Whisper transcription error:', error.message);
    console.error('❌ Error details:', {
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    // Clean up file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }

    res.status(500).json({
      success: false,
      error: 'Transcription failed',
      message: error.message
    });
  }
});

/**
 * Get Whisper service status
 */
router.get('/status', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  res.json({
    configured: !!apiKey && apiKey !== 'your_openai_api_key_here',
    model: 'whisper-1',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

