const axios = require('axios');

/**
 * YTL ILMU Service
 * Integrates with YTL ILMU LLM API for witness testimony analysis
 */
class YTLIlmuService {
  constructor() {
    // YTL ILMU Configuration from environment variables
    this.apiKey = process.env.YTL_ILMU_API_KEY;
    this.baseURL = process.env.YTL_ILMU_BASE_URL || 'https://api.ytlailabs.tech';
    this.model = process.env.YTL_ILMU_MODEL || 'ilmu-trial';
    this.maxTokens = parseInt(process.env.YTL_ILMU_MAX_TOKENS) || 2000;
    this.temperature = parseFloat(process.env.YTL_ILMU_TEMPERATURE) || 0.3;
    
    console.log('🧠 YTL ILMU Service initialized');
    console.log(`   Base URL: ${this.baseURL}`);
    console.log(`   Model: ${this.model}`);
    console.log(`   API Key: ${this.apiKey ? 'Configured' : 'NOT SET'}`);
  }

  /**
   * Process query with YTL ILMU
   * @param {String} prompt - The analysis prompt
   * @returns {String} Response from YTL ILMU
   */
  async processQuery(prompt) {
    try {
      console.log('🧠 Processing with YTL ILMU...');
      
      if (!this.apiKey) {
        throw new Error('YTL ILMU API key not configured');
      }

      const response = await this.callYTLIlmu(prompt);
      
      if (response) {
        console.log('✅ YTL ILMU response received');
        return response;
      } else {
        throw new Error('Empty response from YTL ILMU');
      }
    } catch (error) {
      console.error('❌ YTL ILMU Error:', error.message);
      throw error;
    }
  }

  /**
   * Process conversation for avatar (shorter responses for speech)
   * @param {String} userMessage - User's message
   * @param {String} knowledgeBaseContent - Knowledge base content
   * @param {Array} conversationHistory - Previous messages in OpenAI format
   * @param {String} language - Language code (e.g., 'en-US', 'hi-IN')
   * @returns {String} Response for avatar to speak
   */
  async processConversation(userMessage, knowledgeBaseContent = null, conversationHistory = [], language = null) {
    try {
      console.log('💬 Processing conversation with YTL ILMU:', userMessage);
      console.log('📜 Conversation history length:', conversationHistory.length);
      if (language) {
        console.log('🌍 Response language:', language);
      }

      if (!this.apiKey) {
        throw new Error('YTL ILMU API key not configured');
      }

      // Create conversation prompt with language
      const prompt = this.createConversationPrompt(userMessage, knowledgeBaseContent, conversationHistory, language);

      const response = await this.callYTLIlmuConversation(prompt, conversationHistory);

      if (response) {
        console.log('✅ YTL ILMU conversation response received');
        return response;
      } else {
        throw new Error('Empty response from YTL ILMU');
      }
    } catch (error) {
      console.error('❌ YTL ILMU Conversation Error:', error.message);
      throw error;
    }
  }

  /**
   * Create prompt for conversation
   */
  createConversationPrompt(userMessage, knowledgeBaseContent, conversationHistory = [], language = null) {
    const isCustomKnowledge = knowledgeBaseContent && knowledgeBaseContent.trim().length > 0;

    // Language mapping for natural language names
    const languageNames = {
      'en-US': 'English',
      'hi-IN': 'Hindi',
      'es-ES': 'Spanish',
      'fr-FR': 'French',
      'de-DE': 'German',
      'zh-CN': 'Chinese',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'ar-SA': 'Arabic',
      'pt-PT': 'Portuguese',
      'ru-RU': 'Russian',
      'it-IT': 'Italian',
      'nl-NL': 'Dutch',
      'pl-PL': 'Polish',
      'tr-TR': 'Turkish',
      'vi-VN': 'Vietnamese',
      'th-TH': 'Thai',
      'id-ID': 'Indonesian',
      'ms-MY': 'Malay',
      'sv-SE': 'Swedish',
      'no-NO': 'Norwegian',
      'da-DK': 'Danish',
      'fi-FI': 'Finnish',
      'cs-CZ': 'Czech',
      'sk-SK': 'Slovak',
      'hu-HU': 'Hungarian',
      'ro-RO': 'Romanian',
      'bg-BG': 'Bulgarian',
      'el-GR': 'Greek',
      'uk-UA': 'Ukrainian',
    };

    const languageName = language ? (languageNames[language] || 'English') : 'English';
    const languageInstruction = language && language !== 'en-US'
      ? `\n- CRITICAL: Respond ONLY in ${languageName}. Do NOT use English.`
      : '';

    if (isCustomKnowledge) {
      const isFirstMessage = conversationHistory.length === 0 ||
                            userMessage.toLowerCase().includes('hello') ||
                            userMessage.toLowerCase().includes('hi') ||
                            userMessage.toLowerCase().includes('hey') ||
                            userMessage.toLowerCase().includes('start') ||
                            userMessage.toLowerCase().includes('namaste') ||
                            userMessage.toLowerCase().includes('hola');

      if (isFirstMessage) {
        // Use the knowledge base content as the ENTIRE system prompt (not just as reference)
        // This ensures the persona and instructions from the knowledge base are respected
        return `${knowledgeBaseContent}

USER'S GREETING: "${userMessage}"

INSTRUCTIONS FOR THIS RESPONSE:
- Greet them professionally and briefly
- Keep your response under 50 words (max 300 characters) for avatar speech${languageInstruction}

RESPONSE:`;
      } else {
        // Build a list of questions already asked
        const questionsAsked = conversationHistory
          .filter(msg => msg.role === 'assistant' && msg.content.includes('?'))
          .map(msg => msg.content)
          .join('\n');

        // Use the knowledge base content as the ENTIRE system prompt
        return `${knowledgeBaseContent}

CONVERSATION HISTORY:
${questionsAsked || 'None yet'}

USER'S RESPONSE: "${userMessage}"

INSTRUCTIONS FOR THIS RESPONSE:
- Continue the conversation based on the user's response
- Keep your response under 50 words (max 300 characters) for avatar speech${languageInstruction}

RESPONSE:`;
      }
    } else {
      return `You are a professional legal interviewer conducting witness examinations.

USER MESSAGE: "${userMessage}"

INSTRUCTIONS:
- Respond professionally
- Ask clear, structured questions
- Keep response under 50 words (max 300 characters) for avatar speech
- Be calm and authoritative${languageInstruction}

RESPONSE:`;
    }
  }

  /**
   * Call YTL ILMU for conversation (shorter response)
   */
  async callYTLIlmuConversation(prompt, conversationHistory = []) {
    try {
      console.log('📡 Calling YTL ILMU API for conversation...');
      
      // Build messages array with conversation history
      const messages = [];
      
      // Add system message with the prompt
      messages.push({
        role: 'system',
        content: prompt,
      });
      
      // Add conversation history (last 10 messages to keep context manageable)
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);
      
      console.log('📜 Sending', messages.length, 'messages to YTL ILMU');
      
      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: 100, // Short responses for speech
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const content = response.data.choices[0].message?.content;
        if (content) {
          console.log('✅ YTL ILMU conversation response:', content.substring(0, 100) + '...');
          return content.trim();
        }
      }

      throw new Error('Invalid response format from YTL ILMU');
    } catch (error) {
      if (error.response) {
        console.error('❌ YTL ILMU API Error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('❌ YTL ILMU Network Error: No response received');
      } else {
        console.error('❌ YTL ILMU Error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Call YTL ILMU API
   * NOTE: This is a template - needs to be updated with actual YTL ILMU API format
   */
  async callYTLIlmu(prompt) {
    try {
      console.log('📡 Calling YTL ILMU API...');
      
      // OPTION 1: OpenAI-compatible API format
      // If YTL ILMU uses OpenAI-compatible format:
      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`, // Update endpoint path as needed
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a senior legal analyst with 20+ years of experience evaluating witness testimony. You are known for being thorough, realistic, and constructively critical. You provide evidence-based analysis that helps witnesses improve. Be specific, cite actual examples from the transcript, and give realistic scores (most witnesses score 60-80%, not 90%+). Vary your scores based on actual performance. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          response_format: { type: "json_object" } // If supported
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout
        }
      );

      // OPTION 2: Custom YTL ILMU format
      // Uncomment and modify if YTL ILMU uses a different format:
      /*
      const response = await axios.post(
        `${this.baseURL}/analyze`, // Update with actual endpoint
        {
          prompt: prompt,
          model: this.model,
          parameters: {
            max_tokens: this.maxTokens,
            temperature: this.temperature
          }
        },
        {
          headers: {
            'X-API-Key': this.apiKey, // Update header name if different
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );
      */

      console.log('✅ YTL ILMU API Response Status:', response.status);
      
      if (response.status === 200) {
        // Parse response based on YTL ILMU format
        // OPTION 1: OpenAI-compatible format
        const content = response.data.choices?.[0]?.message?.content?.trim();
        
        // OPTION 2: Custom format - uncomment and modify:
        // const content = response.data.result || response.data.output;
        
        console.log('✅ YTL ILMU Response:', content ? `${content.substring(0, 100)}...` : 'empty');
        return content;
      } else {
        throw new Error(`YTL ILMU API returned status ${response.status}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.error('❌ YTL ILMU API Error - Status:', error.response.status);
        console.error('❌ YTL ILMU API Error - Data:', JSON.stringify(error.response.data));
        console.error('❌ Error Message:', error.response.data?.error?.message || 'Unknown error');
      } else if (error.request) {
        console.error('❌ YTL ILMU Connection Error - No response received');
        console.error('❌ Error details:', error.message);
      } else {
        console.error('❌ YTL ILMU Request Error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Check if YTL ILMU service is configured
   */
  isConfigured() {
    const configured = !!this.apiKey && this.apiKey !== 'your_ytl_ilmu_api_key_here';
    console.log(`🧠 YTL ILMU configured: ${configured}`);
    return configured;
  }

  /**
   * Test connection to YTL ILMU API
   */
  async testConnection() {
    try {
      console.log('🧪 Testing YTL ILMU connection...');
      
      const testPrompt = 'Return a JSON object with a single field "status" set to "ok"';
      const response = await this.processQuery(testPrompt);
      
      console.log('✅ YTL ILMU connection test successful');
      return { success: true, response };
    } catch (error) {
      console.error('❌ YTL ILMU connection test failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new YTLIlmuService();

