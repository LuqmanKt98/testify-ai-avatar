const WebSocket = require('ws');

class OpenAIRealtimeService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = 'gpt-4o-realtime-preview-2024-10-01';
    this.ws = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
  }

  /**
   * Create a new Realtime API session
   */
  async createSession() {
    try {
      console.log('🎙️ Creating OpenAI Realtime API session...');
      
      const url = 'wss://api.openai.com/v1/realtime?model=' + this.model;
      
      this.ws = new WebSocket(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      return new Promise((resolve, reject) => {
        this.ws.on('open', () => {
          console.log('✅ OpenAI Realtime WebSocket connected');
          this.isConnected = true;
          
          // Send session configuration
          this.ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: 'You are a helpful AI assistant for interview training. Keep responses concise (under 50 words) as they will be spoken by an avatar.',
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
                silence_duration_ms: 1500, // 1.5 second pause detection
              },
              temperature: 0.7,
              max_response_output_tokens: 150,
            },
          }));
          
          resolve(true);
        });

        this.ws.on('error', (error) => {
          console.error('❌ OpenAI Realtime WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('🔌 OpenAI Realtime WebSocket closed');
          this.isConnected = false;
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data);
        });
      });
    } catch (error) {
      console.error('❌ Failed to create Realtime session:', error);
      throw error;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      console.log('📥 Realtime API message:', message.type);

      // Notify all registered handlers
      this.messageHandlers.forEach((handler) => {
        handler(message);
      });
    } catch (error) {
      console.error('❌ Error handling Realtime message:', error);
    }
  }

  /**
   * Register a message handler
   */
  onMessage(id, handler) {
    this.messageHandlers.set(id, handler);
  }

  /**
   * Unregister a message handler
   */
  offMessage(id) {
    this.messageHandlers.delete(id);
  }

  /**
   * Send audio data to the Realtime API
   */
  sendAudio(audioData) {
    if (!this.isConnected || !this.ws) {
      console.error('❌ Not connected to Realtime API');
      return false;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: audioData, // base64 encoded PCM16 audio
      }));
      return true;
    } catch (error) {
      console.error('❌ Error sending audio:', error);
      return false;
    }
  }

  /**
   * Commit the audio buffer (trigger response generation)
   */
  commitAudio() {
    if (!this.isConnected || !this.ws) {
      console.error('❌ Not connected to Realtime API');
      return false;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.commit',
      }));
      return true;
    } catch (error) {
      console.error('❌ Error committing audio:', error);
      return false;
    }
  }

  /**
   * Send text message (alternative to audio)
   */
  sendText(text) {
    if (!this.isConnected || !this.ws) {
      console.error('❌ Not connected to Realtime API');
      return false;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: text,
            },
          ],
        },
      }));

      // Trigger response
      this.ws.send(JSON.stringify({
        type: 'response.create',
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Error sending text:', error);
      return false;
    }
  }

  /**
   * Close the Realtime session
   */
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.messageHandlers.clear();
      console.log('✅ Realtime session closed');
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured() {
    return !!this.apiKey && this.apiKey !== 'your_openai_api_key_here';
  }
}

module.exports = new OpenAIRealtimeService();

