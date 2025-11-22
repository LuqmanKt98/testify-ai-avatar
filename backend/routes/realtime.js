const express = require('express');
const router = express.Router();
const WebSocket = require('ws');

// Store active WebSocket connections
const activeConnections = new Map();

/**
 * WebSocket endpoint for OpenAI Realtime API proxy
 * This proxies the connection to hide the API key from the client
 */
function setupRealtimeWebSocket(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    
    if (pathname === '/api/realtime') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs, request) => {
    console.log('🎙️ New Realtime API client connected');
    
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      const model = 'gpt-4o-realtime-preview-2024-10-01';
      
      // Create WebSocket connection to OpenAI
      const openaiUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
      const openaiWs = new WebSocket(openaiUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      const connectionId = Date.now().toString();
      activeConnections.set(connectionId, { clientWs, openaiWs });

      // OpenAI WebSocket opened
      openaiWs.on('open', () => {
        console.log('✅ Connected to OpenAI Realtime API');
        
        // Configure session
        openaiWs.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a helpful AI assistant for interview training. You are having a natural conversation with a user. Keep responses concise (under 50 words) as they will be spoken by an avatar. Be friendly, intelligent, and conversational.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1500,
            },
            temperature: 0.7,
            max_response_output_tokens: 150,
          },
        }));
      });

      // Forward messages from OpenAI to client
      openaiWs.on('message', (data) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data);
        }
      });

      // Forward messages from client to OpenAI
      clientWs.on('message', (data) => {
        if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.send(data);
        }
      });

      // Handle client disconnection
      clientWs.on('close', () => {
        console.log('🔌 Client disconnected from Realtime API');
        if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.close();
        }
        activeConnections.delete(connectionId);
      });

      // Handle OpenAI disconnection
      openaiWs.on('close', () => {
        console.log('🔌 OpenAI Realtime API disconnected');
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close();
        }
        activeConnections.delete(connectionId);
      });

      // Handle errors
      openaiWs.on('error', (error) => {
        console.error('❌ OpenAI Realtime API error:', error);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'error',
            error: error.message,
          }));
        }
      });

      clientWs.on('error', (error) => {
        console.error('❌ Client WebSocket error:', error);
      });

    } catch (error) {
      console.error('❌ Error setting up Realtime API connection:', error);
      clientWs.close();
    }
  });

  return wss;
}

// Get Realtime API status
router.get('/status', (req, res) => {
  res.json({
    configured: !!process.env.OPENAI_API_KEY,
    model: 'gpt-4o-realtime-preview-2024-10-01',
    activeConnections: activeConnections.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = { router, setupRealtimeWebSocket };

