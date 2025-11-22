import axios from 'axios';

interface HeyGenTokenResponse {
  data: {
    token: string;
  };
}

interface HeyGenSessionResponse {
  data: {
    session_id: string;
    url: string;
    access_token: string;
    ice_servers2: any[];
  };
}

interface HeyGenKnowledgeBaseResponse {
  data: {
    knowledge_id: string;
  };
}

// Global Maps to persist across module reloads (HMR)
const globalSessionTokens = new Map<string, string>();
const globalSessionMetadata = new Map<string, any>();

export class HeyGenService {
  private static instance: HeyGenService;
  private apiKey: string;
  private baseUrl: string;
  private defaultAvatarId: string;
  private defaultVoice: string;
  private sessionToken: string | null = null;

  // Use global Maps to persist across HMR reloads
  private sessionTokens: Map<string, string> = globalSessionTokens;
  private sessionMetadata: Map<string, any> = globalSessionMetadata;

  // Language to voice mapping for multi-language support
  private languageVoiceMap: Record<string, string> = {
    'bg-BG': 'Josh', // Bulgarian
    'zh-CN': 'Josh', // Chinese
    'cs-CZ': 'Josh', // Czech
    'da-DK': 'Josh', // Danish
    'nl-NL': 'Josh', // Dutch
    'en-US': 'Josh', // English
    'fi-FI': 'Josh', // Finnish
    'fr-FR': 'Josh', // French
    'de-DE': 'Josh', // German
    'el-GR': 'Josh', // Greek
    'hi-IN': 'Josh', // Hindi
    'hu-HU': 'Josh', // Hungarian
    'id-ID': 'Josh', // Indonesian
    'it-IT': 'Josh', // Italian
    'ja-JP': 'Josh', // Japanese
    'ko-KR': 'Josh', // Korean
    'ms-MY': 'Josh', // Malay
    'no-NO': 'Josh', // Norwegian
    'pl-PL': 'Josh', // Polish
    'pt-PT': 'Josh', // Portuguese
    'ro-RO': 'Josh', // Romanian
    'ru-RU': 'Josh', // Russian
    'sk-SK': 'Josh', // Slovak
    'es-ES': 'Josh', // Spanish
    'sv-SE': 'Josh', // Swedish
    'tr-TR': 'Josh', // Turkish
    'uk-UA': 'Josh', // Ukrainian
    'vi-VN': 'Josh', // Vietnamese
  };

  private constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY || '';
    this.baseUrl = process.env.HEYGEN_BASE_URL || 'https://api.heygen.com';
    this.defaultAvatarId = process.env.HEYGEN_AVATAR_ID || 'Dexter_Lawyer_Sitting_public';
    this.defaultVoice = process.env.HEYGEN_DEFAULT_VOICE || 'Josh';
  }

  static getInstance(): HeyGenService {
    if (!HeyGenService.instance) {
      HeyGenService.instance = new HeyGenService();
    }
    return HeyGenService.instance;
  }

  // Step 1: Create session token (required for all subsequent API calls)
  async createSessionToken(): Promise<string | null> {
    try {
      console.log('🔑 Creating HeyGen session token...');

      const response = await axios.post<HeyGenTokenResponse>(
        `${this.baseUrl}/v1/streaming.create_token`,
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
    } catch (error: any) {
      console.error('Error creating session token:', error.response?.data || error.message);
      return null;
    }
  }

  // Step 2: Create new streaming session
  async createSession(avatarId?: string, quality: string = 'medium', knowledgeId?: string, language?: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('HeyGen API key not configured');
    }

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
        throw new Error('Failed to create session token');
      }

      // Determine voice based on language if provided
      let voiceConfig: string;
      if (language && this.languageVoiceMap[language]) {
        voiceConfig = this.languageVoiceMap[language];
        console.log(`🎤 Using voice for ${language}: ${voiceConfig}`);
      } else {
        voiceConfig = this.defaultVoice || 'Josh';
      }
      const voiceObj = typeof voiceConfig === 'string' ? { voice: voiceConfig } : voiceConfig;

      // Build request body
      const requestBody: any = {
        quality: quality,
        avatar_name: avatarId || this.defaultAvatarId,
        voice: voiceObj,
        version: 'v2',
        video_encoding: 'H264',
      };

      // Add knowledge base ID if provided
      if (knowledgeId) {
        requestBody.knowledge_id = knowledgeId;
      }

      const response = await axios.post<HeyGenSessionResponse>(
        `${this.baseUrl}/v1/streaming.new`,
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

        console.log('📊 HeyGen API Response:', JSON.stringify(response.data, null, 2));
        console.log('🔍 ICE Servers 2:', data.ice_servers2);

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
        this.sessionToken = freshToken;

        console.log('✅ HeyGen session started:', newSessionId);
        console.log('✅ Session token stored for session:', newSessionId);
        console.log('💾 Total sessions in map:', this.sessionTokens.size);

        return {
          success: true,
          sessionId: newSessionId,
          url: data.url,
          accessToken: data.access_token,
          iceServers: data.ice_servers2, // Use ice_servers2 from the response
        };
      } else {
        console.error('HeyGen start session error:', response.status, response.data);
        throw new Error('Failed to create HeyGen session');
      }
    } catch (error: any) {
      console.error('HeyGen create session error:', error.response?.data || error.message);
      throw new Error('Failed to create HeyGen session');
    }
  }

  // Step 3: Start streaming (must be called AFTER WebRTC connection is prepared)
  async startStreaming(sessionId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('HeyGen API key not configured');
    }

    try {
      console.log('🎭 Starting HeyGen streaming for session:', sessionId);
      console.log('💾 Total sessions in map (startStreaming):', this.sessionTokens.size);
      console.log('💾 Available session IDs:', Array.from(this.sessionTokens.keys()));

      // Get the token for this specific session
      let token: string | null = this.sessionTokens.get(sessionId) || null;

      if (!token) {
        console.warn('⚠️ No token found for session:', sessionId);
        console.log('🔄 Attempting to use current session token...');
        token = this.sessionToken;
      }

      if (!token) {
        console.error('❌ No session token available for session:', sessionId);
        console.error('Available sessions:', Array.from(this.sessionTokens.keys()));
        throw new Error('No session token available');
      }

      console.log('🔑 Using token for session:', sessionId);

      const response = await axios.post(
        `${this.baseUrl}/v1/streaming.start`,
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
        console.log('✅ HeyGen streaming started successfully');
        return {
          success: true,
          data: response.data,
        };
      } else {
        console.error('HeyGen start streaming error:', response.status, response.data);
        throw new Error('Failed to start streaming');
      }
    } catch (error: any) {
      console.error('HeyGen start streaming error:', error.response?.data || error.message);
      throw new Error('Failed to start HeyGen streaming');
    }
  }

  async sendTask(sessionId: string, text: string, taskType: 'talk' | 'repeat' | 'chat' = 'repeat'): Promise<any> {
    if (!this.apiKey) {
      throw new Error('HeyGen API key not configured');
    }

    try {
      console.log(`🎭 HeyGen ${taskType}:`, text);

      // Get the token for this specific session
      let token: string | null = this.sessionTokens.get(sessionId) || null;

      if (!token) {
        console.warn('⚠️ No token found for session:', sessionId);
        token = this.sessionToken;
      }

      if (!token) {
        console.error('❌ No session token available for session:', sessionId);
        throw new Error('No session token available');
      }

      const response = await axios.post(
        `${this.baseUrl}/v1/streaming.task`,
        {
          session_id: sessionId,
          text,
          task_type: taskType,
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
        console.log('✅ HeyGen task success');
        return {
          success: true,
          data: response.data,
        };
      } else {
        console.error('HeyGen task error:', response.status, response.data);
        throw new Error('Failed to send task');
      }
    } catch (error: any) {
      console.error('HeyGen send task error:', error.response?.data || error.message);
      throw new Error('Failed to send task to HeyGen');
    }
  }

  async stopSession(sessionId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('HeyGen API key not configured');
    }

    try {
      console.log('🎭 Stopping HeyGen session:', sessionId);

      // Get the token for this specific session
      let token: string | null = this.sessionTokens.get(sessionId) || null;

      if (!token) {
        console.warn('⚠️ No token found for session:', sessionId);
        token = this.sessionToken;
      }

      if (!token) {
        console.error('❌ No session token available for session:', sessionId);
        throw new Error('No session token available');
      }

      const response = await axios.post(
        `${this.baseUrl}/v1/streaming.stop`,
        {
          session_id: sessionId,
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
        console.log('✅ HeyGen session stopped successfully');

        // Clear the session-specific data
        this.sessionTokens.delete(sessionId);
        this.sessionMetadata.delete(sessionId);

        // Clear singleton token if it matches
        if (this.sessionToken === token) {
          this.sessionToken = null;
        }

        return {
          success: true,
          data: response.data,
        };
      } else {
        console.error('HeyGen stop session error:', response.status, response.data);
        throw new Error('Failed to stop session');
      }
    } catch (error: any) {
      console.error('HeyGen stop session error:', error.response?.data || error.message);
      throw new Error('Failed to stop HeyGen session');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const heygenService = HeyGenService.getInstance();

