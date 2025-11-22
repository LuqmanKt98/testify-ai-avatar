const axios = require('axios');

class HeyGenService {
  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY;
    this.baseURL = process.env.HEYGEN_BASE_URL || 'https://api.heygen.com';
    this.defaultAvatarId = process.env.HEYGEN_AVATAR_ID;
    this.defaultVoice = process.env.HEYGEN_DEFAULT_VOICE;
    this.sessionId = null;
    this.sessionToken = null; // This will store the Bearer token from create_token
    this._lastSessionUrl = null;
    this._lastIceServers = null;

    // Map to store tokens per session ID
    this.sessionTokens = new Map();
    this.sessionMetadata = new Map();

    // Map to store keep-alive timers per session
    this.keepAliveTimers = new Map();

    // Language to voice mapping for multi-language support
    this.languageVoiceMap = {
      'bg-BG': 'b46125eedb894e358d86210c5e11c041', // Bulgarian - Borislav (Professional, Male)
      'zh-CN': '3b1633a466c44379bf8b5a2884727588', // Chinese - YunJhe (Natural, Male)
      'cs-CZ': '0bde88bedf264a52befce6ae6d6c70be', // Czech - Honza (Professional, Male)
      'da-DK': '5d3e04e2972b4019b68d18d336800615', // Danish - Mads (Natural, Male)
      'nl-NL': '4b9b8a0176ae40b09a8ae1eaa26c509b', // Dutch - Ernestine (Natural, Male)
      'en-US': '9169e484eb0740b286ef8a679d78fa3f', // English - Glenn (Natural, Male)
      'fi-FI': 'c7b89c2854214a2f9709534a873a57ea', // Finnish - Harri (Natural, Male)
      'fr-FR': '51ce3a14b89947bcb6c13d5e5062331a', // French - Antoine (Natural, Male)
      'de-DE': '071d6bea6a7f455b82b6364dab9104a2', // German - Jan (Natural, Male)
      'el-GR': '8bc71625549d425d9a38b4e4a296ba32', // Greek - Nestoras (Natural, Male)
      'hi-IN': '957336970bc64d479d551fea07e56784', // Hindi - Madhur (Natural, Male)
      'hu-HU': '98b855ef6768468bbcc95f1c5c5c27c0', // Hungarian - Tamas (Natural, Male)
      'id-ID': '269792ff849b43b7b1488a6783a58563', // Indonesian - Slamet (Natural, Male)
      'it-IT': 'dbcfe683e60a4bed9b8957d1f5d6de98', // Italian - Diego (Natural, Male)
      'ja-JP': '577bfbe87867492db805d58fd529a86d', // Japanese - Archie (Male)
      'ko-KR': '9d81087c3f9a45df8c22ab91cf46ca89', // Korean - InJoon (Natural, Male)
      'ms-MY': '2f686fff829b47128078fa093ff33f7d', // Malay - Aiman (Natural, Male)
      'no-NO': '4efd43386dc844c29d532cb5d5690f86', // Norwegian - Finn (Natural, Male)
      'pl-PL': 'f2d44cfdd1dc4846ae54a01d9db9d9fe', // Polish - Marek (Natural, Male)
      'pt-PT': 'a53be0a403ce4ae586f002ba0c125b2c', // Portuguese - Paulo (Natural, Male)
      'ro-RO': 'ec218e50cc9c4991894676a31e4804c5', // Romanian - Emil (Natural, Male)
      'ru-RU': '81bb7c1a521442f6b812b2294a29acc1', // Russian - Dmitry (Professional, Male)
      'sk-SK': '5646809bd96e40e9b374ba1d734ceb69', // Slovak - Lukas (Natural, Male)
      'es-ES': '08284d3fc63a424fbe80cc1864ed2540', // Spanish - Dario (Natural, Male)
      'sv-SE': 'fa4de0d162464cdf9311f73e83a556d7', // Swedish - Marcus (Natural, Male)
      'tr-TR': '7f6838b1b0f141deba891800621a4fe8', // Turkish - Emre Kadir (Male)
      'uk-UA': '2c56cc1229214db587034c56a69df99a', // Ukrainian - Ostap (Professional, Male)
      'vi-VN': 'c6fb81520dcd42e0a02be231046a8639', // Vietnamese - NamMinh (Natural, Male)
    };
  }

  // Singleton pattern
  static getInstance() {
    if (!HeyGenService.instance) {
      HeyGenService.instance = new HeyGenService();
    }
    return HeyGenService.instance;
  }

  // Start keep-alive mechanism for a session
  startSessionKeepAlive(sessionId) {
    try {
      // Clear any existing timer for this session
      if (this.keepAliveTimers.has(sessionId)) {
        clearInterval(this.keepAliveTimers.get(sessionId));
      }

      console.log('💓 Starting session keep-alive for:', sessionId);

      // Send a heartbeat every 30 seconds to keep session alive
      const timer = setInterval(async () => {
        try {
          // Send keep-alive heartbeat using the correct HeyGen API endpoint
          console.log('💓 Sending keep-alive heartbeat for session:', sessionId);

          try {
            const response = await axios.post(
              `${this.baseURL}/v1/streaming.keep_alive`,
              {
                session_id: sessionId
              },
              {
                headers: {
                  'X-API-KEY': this.apiKey,
                  'Content-Type': 'application/json',
                },
                timeout: 10000,
              }
            );

            if (response.data && response.data.code === 100) {
              console.log('✅ Keep-alive heartbeat sent successfully');
            } else {
              console.warn('⚠️ Keep-alive returned unexpected response:', response.data);
            }
          } catch (keepAliveError) {
            console.error('❌ Keep-alive failed:', keepAliveError.message);
            if (keepAliveError.response) {
              console.error('❌ Keep-alive error response:', keepAliveError.response.data);
            }
            // If keep-alive fails, the session might be dead, so stop the timer
            console.warn('⚠️ Stopping keep-alive timer due to error');
            clearInterval(timer);
            this.keepAliveTimers.delete(sessionId);
          }
        } catch (error) {
          console.error('❌ Keep-alive error:', error.message);
        }
      }, 30000); // Every 30 seconds

      this.keepAliveTimers.set(sessionId, timer);
      console.log('✅ Keep-alive started for session:', sessionId);
    } catch (error) {
      console.error('❌ Failed to start keep-alive:', error.message);
    }
  }

  // Stop keep-alive mechanism for a session
  stopSessionKeepAlive(sessionId) {
    try {
      if (this.keepAliveTimers.has(sessionId)) {
        clearInterval(this.keepAliveTimers.get(sessionId));
        this.keepAliveTimers.delete(sessionId);
        console.log('💓 Keep-alive stopped for session:', sessionId);
      }
    } catch (error) {
      console.error('❌ Failed to stop keep-alive:', error.message);
    }
  }

  // Step 1: Create session token (required for all subsequent API calls)
  async createSessionToken() {
    try {
      console.log('🔑 Creating HeyGen session token...');

      const response = await axios.post(
        `${this.baseURL}/v1/streaming.create_token`,
        {},
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200 && response.data.data) {
        this.sessionToken = response.data.data.token;
        console.log('✅ Session token created successfully');
        return this.sessionToken;
      } else {
        console.error('Failed to create session token:', response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error('Error creating session token:', error.response?.data || error.message);
      return null;
    }
  }

  // Step 2: Create new streaming session
  async startSession(avatarId = null, voice = null, quality = 'high', knowledgeId = null, language = null) {
    try {
      console.log('🎭 Starting HeyGen session...');
      if (knowledgeId) {
        console.log('📚 Using Knowledge Base ID:', knowledgeId);
      }
      if (language) {
        console.log('🌍 Using language:', language);
      }

      // Always create a fresh session token for each new session
      console.log('🔑 Creating fresh session token for new session...');
      const freshToken = await this.createSessionToken();
      if (!freshToken) {
        console.error('❌ Failed to create session token');
        return null;
      }

      // Determine voice based on language if provided
      let voiceConfig;
      if (language && this.languageVoiceMap[language]) {
        voiceConfig = { voice: this.languageVoiceMap[language] };
        console.log(`🎤 Using voice for ${language}: ${this.languageVoiceMap[language]}`);
      } else if (voice) {
        voiceConfig = typeof voice === 'string' ? { voice: voice } : voice;
      } else {
        voiceConfig = this.defaultVoice || { voice: 'Josh' };
        if (typeof voiceConfig === 'string') {
          voiceConfig = { voice: voiceConfig };
        }
      }

      // Build request body
      const requestBody = {
        quality: quality,
        avatar_name: avatarId || this.defaultAvatarId || 'Dexter_Lawyer_Sitting_public',
        voice: voiceConfig,
        version: 'v2',
        video_encoding: 'H264',
      };

      // Add knowledge base ID if provided
      if (knowledgeId) {
        requestBody.knowledge_id = knowledgeId;
      }

      const response = await axios.post(
        `${this.baseURL}/v1/streaming.new`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${freshToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200) {
        const data = response.data.data;
        const newSessionId = data.session_id;
        const livekitAccessToken = data.access_token;

        // Store token and metadata per session
        this.sessionTokens.set(newSessionId, freshToken);
        this.sessionMetadata.set(newSessionId, {
          createdAt: new Date(),
          avatarId: avatarId || this.defaultAvatarId,
          knowledgeId: knowledgeId,
          url: data.url,
          iceServers: data.ice_servers2,
        });

        // Also update the singleton properties for backward compatibility
        this.sessionId = newSessionId;
        this.sessionToken = freshToken;
        this._lastSessionUrl = data.url;
        this._lastIceServers = data.ice_servers2;

        console.log('✅ HeyGen session started:', newSessionId);
        console.log('✅ Session token stored for session:', newSessionId);
        console.log('✅ HeyGen session ready for LiveKit integration');

        // Start keep-alive mechanism to prevent session timeout
        this.startSessionKeepAlive(newSessionId);

        return {
          session_id: newSessionId,
          url: data.url,
          access_token: livekitAccessToken,
          ice_servers2: data.ice_servers2,
        };
      } else {
        console.error('HeyGen start session error:', response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error('HeyGen start session error:', error.response?.data || error.message);
      return null;
    }
  }

  // Step 3: Start streaming (must be called AFTER room.prepareConnection() on the client side)
  async startStreaming(sessionId) {
    try {
      console.log('🎭 Starting HeyGen streaming...');
      console.log('📋 Session ID:', sessionId);

      // Get the token for this specific session
      let token = this.sessionTokens.get(sessionId);

      if (!token) {
        console.warn('⚠️ No token found for session:', sessionId);
        console.log('🔄 Attempting to use current session token...');
        token = this.sessionToken;
      }

      if (!token) {
        console.error('❌ No session token available for session:', sessionId);
        console.error('Available sessions:', Array.from(this.sessionTokens.keys()));
        return null;
      }

      console.log('🔑 Using token for session:', sessionId);

      const response = await axios.post(
        `${this.baseURL}/v1/streaming.start`,
        {
          session_id: sessionId,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200) {
        console.log('✅ HeyGen streaming started successfully for session:', sessionId);
        return response.data;
      } else {
        console.error('HeyGen start streaming error:', response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error('HeyGen start streaming error:', error.response?.status, error.response?.data || error.message);
      return null;
    }
  }

  async speak(text, sessionId = null) {
    // Use provided sessionId or fall back to this.sessionId
    const targetSessionId = sessionId || this.sessionId;

    if (!targetSessionId) {
      console.log('❌ No active HeyGen session to speak in.');
      return false;
    }

    if (!text || text.trim().length === 0) {
      console.log('⚠️ Skipping empty text');
      return true;
    }

    try {
      console.log('🎭 HeyGen Speak:', text);
      console.log('📋 Using session:', targetSessionId);

      // Get token for this session
      let token = this.sessionTokens.get(targetSessionId) || this.sessionToken;
      if (!token) {
        console.error('❌ No token available for session:', targetSessionId);
        return false;
      }

      // REMOVED: Do NOT call startStreaming() here - it should only be called once during initialization
      // Calling startStreaming() on an already-streaming session causes it to go into an invalid state
      // and HeyGen will close the session after ~30 seconds

      const response = await axios.post(
        `${this.baseURL}/v1/streaming.task`,
        {
          session_id: targetSessionId,
          text: text,
          task_type: 'repeat',
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200) {
        console.log('✅ HeyGen speak success:', response.data);
        return response.data; // Return full response data including duration_ms
      } else {
        console.error('HeyGen speak error:', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ HeyGen speak error:', error.message);

      // If we get a 400 error, it might be because the session is not in the correct state
      if (error.response && error.response.status === 400) {
        console.error('❌ Session state error:', error.response.data);
        console.log('💡 Hint: The session might have timed out or been closed. Try creating a new session.');
      }

      return false;
    }
  }


  /**
   * Send chat message to HeyGen (uses Knowledge Base AI)
   * Use this when you have a Knowledge Base attached to the session
   */
  async sendChatMessage(text) {
    if (!this.sessionId) {
      console.error('No active HeyGen session');
      return false;
    }

    try {
      console.log('💬 HeyGen Chat:', text);
      console.log('🎭 Sending chat message with KB...');

      // Get token for this session
      let token = this.sessionTokens.get(this.sessionId) || this.sessionToken;
      if (!token) {
        console.error('❌ No token available for session:', this.sessionId);
        return false;
      }

      const response = await axios.post(
        `${this.baseURL}/v1/streaming.task`,
        {
          session_id: this.sessionId,
          text: text,
          task_type: 'chat', // 'chat' uses KB AI, 'repeat' just speaks text
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200) {
        console.log('✅ HeyGen chat success:', response.data);
        return response.data;
      } else {
        console.error('HeyGen chat error:', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error('HeyGen chat connection error:', error.message);
      return false;
    }
  }

  /**
   * Interrupt avatar speech
   * Stops the current speech task
   */
  async interruptSpeech() {
    console.log('⏹️ [INTERRUPT] interruptSpeech() called');
    console.log('⏹️ [INTERRUPT] Current sessionId:', this.sessionId);
    console.log('⏹️ [INTERRUPT] Current sessionToken:', this.sessionToken ? 'EXISTS' : 'MISSING');
    console.log('⏹️ [INTERRUPT] sessionTokens map size:', this.sessionTokens.size);

    if (!this.sessionId) {
      console.error('❌ [INTERRUPT] No active HeyGen session to interrupt');
      return false;
    }

    try {
      console.log('⏹️ [INTERRUPT] Interrupting HeyGen speech for session:', this.sessionId);

      // Get token for this session
      let token = this.sessionTokens.get(this.sessionId) || this.sessionToken;
      console.log('⏹️ [INTERRUPT] Token source:', this.sessionTokens.has(this.sessionId) ? 'sessionTokens map' : 'sessionToken property');
      console.log('⏹️ [INTERRUPT] Token available:', token ? 'YES' : 'NO');

      if (!token) {
        console.error('❌ [INTERRUPT] No token available for session:', this.sessionId);
        return false;
      }

      // Send interrupt request to HeyGen API
      console.log('⏹️ [INTERRUPT] Sending interrupt request to HeyGen API...');
      console.log('⏹️ [INTERRUPT] URL:', `${this.baseURL}/v1/streaming.interrupt`);
      console.log('⏹️ [INTERRUPT] Session ID:', this.sessionId);

      const response = await axios.post(
        `${this.baseURL}/v1/streaming.interrupt`,
        {
          session_id: this.sessionId,
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('⏹️ [INTERRUPT] HeyGen API response status:', response.status);
      console.log('⏹️ [INTERRUPT] HeyGen API response data:', JSON.stringify(response.data, null, 2));

      if (response.status === 200) {
        console.log('✅ [INTERRUPT] HeyGen speech interrupted successfully');
        return true;
      } else {
        console.error('❌ [INTERRUPT] HeyGen interrupt error:', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ [INTERRUPT] HeyGen interrupt connection error:', error.message);
      console.error('❌ [INTERRUPT] Error details:', error);
      if (error.response) {
        console.error('❌ [INTERRUPT] Response status:', error.response.status);
        console.error('❌ [INTERRUPT] Response data:', error.response.data);
      }
      return false;
    }
  }

  async endSession() {
    if (!this.sessionId) {
      console.log('No active HeyGen session to end.');
      return true;
    }

    try {
      console.log('🎭 Ending HeyGen session:', this.sessionId);

      const response = await axios.post(
        `${this.baseURL}/v1/streaming.stop`,
        {
          session_id: this.sessionId,
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200) {
        console.log('✅ HeyGen session ended successfully');
      } else {
        console.error('HeyGen end session error:', response.status, response.data);
      }

      // Clean up session-specific data
      const sessionIdToClean = this.sessionId;

      // Stop keep-alive mechanism
      this.stopSessionKeepAlive(sessionIdToClean);

      this.sessionTokens.delete(sessionIdToClean);
      this.sessionMetadata.delete(sessionIdToClean);

      // Clear singleton session data
      this.sessionId = null;
      this.sessionToken = null;

      console.log('✅ Session data cleaned up for:', sessionIdToClean);

      return true;
    } catch (error) {
      console.error('HeyGen end session error:', error.message);
      // Clear session data even if there was an error
      const sessionIdToClean = this.sessionId;

      // Stop keep-alive mechanism
      this.stopSessionKeepAlive(sessionIdToClean);

      this.sessionTokens.delete(sessionIdToClean);
      this.sessionMetadata.delete(sessionIdToClean);
      this.sessionId = null;
      this.sessionToken = null;
      return true;
    }
  }

  isConfigured() {
    console.log('🔧 HeyGen Service Environment Check:');
    console.log('API Key:', this.apiKey ? 'Set' : 'Not set');
    console.log('Base URL:', this.baseURL);
    console.log('Default Avatar ID:', this.defaultAvatarId);
    return !!this.apiKey && this.apiKey !== 'your_heygen_api_key_here';
  }

  getSessionInfo() {
    const sessionMetadata = this.sessionMetadata.get(this.sessionId);
    return {
      sessionId: this.sessionId,
      sessionToken: this.sessionToken ? '***REDACTED***' : null,
      url: this._lastSessionUrl,
      iceServers: this._lastIceServers,
      hasToken: !!this.sessionToken,
      metadata: sessionMetadata,
      activeSessions: Array.from(this.sessionTokens.keys()),
      totalActiveSessions: this.sessionTokens.size,
    };
  }

  // ==================== KNOWLEDGE BASE METHODS ====================

  /**
   * Create a new Knowledge Base
   * @param {string} name - Name of the knowledge base
   * @param {string} opening - Opening/greeting message for the avatar
   * @param {string} prompt - Custom instructions/knowledge for the LLM
   * @returns {Promise<Object|null>} - Returns { knowledgeId } on success, null on failure
   */
  async createKnowledgeBase(name, opening, prompt) {
    try {
      console.log('📚 Creating HeyGen Knowledge Base:', name);

      const response = await axios.post(
        `${this.baseURL}/v1/streaming/knowledge_base/create`,
        {
          name: name,
          opening: opening,
          prompt: prompt,
        },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200 && (response.data.code === 0 || response.data.code === 100)) {
        const knowledgeId = response.data.data.knowledgeId || response.data.data.id;
        console.log('✅ Knowledge Base created successfully:', knowledgeId);
        return {
          knowledgeId: knowledgeId,
          name: name,
          opening: opening,
          prompt: prompt,
        };
      } else {
        console.error('Failed to create knowledge base:', response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error('Error creating knowledge base:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Update an existing Knowledge Base
   * @param {string} knowledgeId - ID of the knowledge base to update
   * @param {string} name - Updated name
   * @param {string} opening - Updated opening message
   * @param {string} prompt - Updated prompt/instructions
   * @returns {Promise<boolean>} - Returns true on success, false on failure
   */
  async updateKnowledgeBase(knowledgeId, name, opening, prompt) {
    try {
      console.log('📚 Updating HeyGen Knowledge Base:', knowledgeId);

      const response = await axios.post(
        `${this.baseURL}/v1/streaming/knowledge_base/update`,
        {
          knowledge_id: knowledgeId,
          name: name,
          opening: opening,
          prompt: prompt,
        },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200 && response.data.code === 0) {
        console.log('✅ Knowledge Base updated successfully');
        return true;
      } else {
        console.error('Failed to update knowledge base:', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error('Error updating knowledge base:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * List all Knowledge Bases
   * @returns {Promise<Array|null>} - Returns array of knowledge bases on success, null on failure
   */
  async listKnowledgeBases() {
    try {
      console.log('📚 Listing HeyGen Knowledge Bases...');
      console.log('📚 API Key:', this.apiKey ? 'SET' : 'NOT SET');
      console.log('📚 Base URL:', this.baseURL);

      const response = await axios.get(
        `${this.baseURL}/v1/streaming/knowledge_base/list`,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('📚 Response status:', response.status);
      console.log('📚 Response data type:', typeof response.data);
      console.log('📚 Response data keys:', Object.keys(response.data));
      console.log('📚 Response data.code:', response.data.code);
      console.log('📚 Response data.data type:', Array.isArray(response.data.data) ? 'array' : typeof response.data.data);
      console.log('📚 Response data.data length:', Array.isArray(response.data.data) ? response.data.data.length : 'N/A');
      console.log('📚 Full Response data:', JSON.stringify(response.data, null, 2));

      // Handle different response structures
      if (response.status === 200) {
        // Check if response has code === 0 or code === 100 (success)
        if (response.data.code === 0 || response.data.code === 100) {
          // Check if data is in response.data.data.list (HeyGen API v1 format)
          if (response.data.data && response.data.data.list && Array.isArray(response.data.data.list)) {
            const knowledgeBases = response.data.data.list;
            console.log(`✅ Found ${knowledgeBases.length} Knowledge Bases (code === ${response.data.code}, data.list)`);
            return knowledgeBases;
          }
          // Check if data is in response.data.data (standard format)
          else if (Array.isArray(response.data.data)) {
            const knowledgeBases = response.data.data;
            console.log(`✅ Found ${knowledgeBases.length} Knowledge Bases (code === ${response.data.code}, data field)`);
            return knowledgeBases;
          }
          // If data field is empty or not an array
          else {
            console.log(`✅ Found 0 Knowledge Bases (code === ${response.data.code}, but no data)`);
            return [];
          }
        }
        // If no code field, assume data is directly the array
        else if (Array.isArray(response.data)) {
          console.log(`✅ Found ${response.data.length} Knowledge Bases (direct array)`);
          return response.data;
        }
        // If data field contains array
        else if (Array.isArray(response.data.data)) {
          const knowledgeBases = response.data.data;
          console.log(`✅ Found ${knowledgeBases.length} Knowledge Bases (data field)`);
          return knowledgeBases;
        }
        else {
          console.error('❌ Unexpected response structure:', response.data);
          return [];
        }
      } else {
        console.error('❌ Failed to list knowledge bases:', response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error('❌ Error listing knowledge bases:', error.message);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Full error:', error);
      return null;
    }
  }

  /**
   * Get a specific Knowledge Base by ID
   * @param {string} knowledgeId - ID of the knowledge base
   * @returns {Promise<Object|null>} - Returns knowledge base details on success, null on failure
   */
  async getKnowledgeBase(knowledgeId) {
    try {
      console.log('📚 Getting HeyGen Knowledge Base:', knowledgeId);

      const response = await axios.get(
        `${this.baseURL}/v1/streaming/knowledge_base/${knowledgeId}`,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200 && response.data.code === 0) {
        console.log('✅ Knowledge Base retrieved successfully');
        return response.data.data;
      } else {
        console.error('Failed to get knowledge base:', response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error('Error getting knowledge base:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get Knowledge Base Details by ID
   * Since HeyGen API doesn't have a direct endpoint to get a specific KB,
   * we fetch all KBs and find the one with matching ID
   * @param {string} knowledgeId - ID of the knowledge base
   * @returns {Promise<Object|null>} - Returns knowledge base details on success, null on failure
   */
  async getKnowledgeBaseDetails(knowledgeId) {
    try {
      console.log('📚 Fetching Knowledge Base Details:', knowledgeId);

      // Fetch all knowledge bases
      const allKBs = await this.listKnowledgeBases();

      if (!allKBs || allKBs.length === 0) {
        console.warn('⚠️ No knowledge bases found');
        return null;
      }

      // Find the KB with matching ID
      const kbData = allKBs.find(kb => kb.id === knowledgeId);

      if (kbData) {
        console.log('✅ Knowledge Base Details retrieved:', {
          id: kbData?.id,
          name: kbData?.name,
          hasPrompt: !!kbData?.prompt,
          hasOpening: !!kbData?.opening,
        });
        return kbData;
      } else {
        console.warn(`⚠️ Knowledge Base with ID ${knowledgeId} not found`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting knowledge base details:', error.message);
      return null;
    }
  }

  /**
   * Delete a Knowledge Base
   * @param {string} knowledgeId - ID of the knowledge base to delete
   * @returns {Promise<boolean>} - Returns true on success, false on failure
   */
  async deleteKnowledgeBase(knowledgeId) {
    try {
      console.log('📚 Deleting HeyGen Knowledge Base:', knowledgeId);

      const response = await axios.delete(
        `${this.baseURL}/v1/streaming/knowledge_base/${knowledgeId}`,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200 && response.data.code === 0) {
        console.log('✅ Knowledge Base deleted successfully');
        return true;
      } else {
        console.error('Failed to delete knowledge base:', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error.response?.data || error.message);
      return false;
    }
  }
}

module.exports = HeyGenService.getInstance();
