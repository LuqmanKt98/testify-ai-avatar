const axios = require('axios');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 80;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
    this.maxResponseLength = 4000; // HeyGen limit is 5000, using 4000 for safety
  }

  async processQuery(userMessage, knowledgeBaseContent = null, conversationHistory = [], language = null) {
    try {
      console.log('🤖 Processing query with OpenAI:', userMessage);
      console.log('📜 Conversation history length:', conversationHistory.length);
      if (language) {
        console.log('🌍 Response language:', language);
      }

      const prompt = this.createPrompt(userMessage, knowledgeBaseContent, conversationHistory, language);
      const response = await this.callOpenAI(prompt, conversationHistory);

      if (response) {
        console.log('✅ OpenAI response received');
        return response;
      } else {
        console.log('⚠️ OpenAI API failed, falling back to knowledge base');
        return this.getKnowledgeBaseResponse(userMessage, language);
      }
    } catch (error) {
      console.error('❌ OpenAI Service Error:', error.message);
      return this.getKnowledgeBaseResponse(userMessage, language);
    }
  }

  createPrompt(userMessage, knowledgeBaseContent, conversationHistory = [], language = null) {
    const isCustomKnowledge = knowledgeBaseContent && knowledgeBaseContent.trim().length > 0;

    // Language mapping
    const languageNames = {
      'en-US': 'English', 'hi-IN': 'Hindi', 'es-ES': 'Spanish', 'fr-FR': 'French',
      'de-DE': 'German', 'zh-CN': 'Chinese', 'ja-JP': 'Japanese', 'ko-KR': 'Korean',
      'ar-SA': 'Arabic', 'pt-PT': 'Portuguese', 'ru-RU': 'Russian', 'it-IT': 'Italian',
      'nl-NL': 'Dutch', 'pl-PL': 'Polish', 'tr-TR': 'Turkish', 'vi-VN': 'Vietnamese',
      'th-TH': 'Thai', 'id-ID': 'Indonesian', 'ms-MY': 'Malay', 'sv-SE': 'Swedish',
      'no-NO': 'Norwegian', 'da-DK': 'Danish', 'fi-FI': 'Finnish', 'cs-CZ': 'Czech',
      'sk-SK': 'Slovak', 'hu-HU': 'Hungarian', 'ro-RO': 'Romanian', 'bg-BG': 'Bulgarian',
      'el-GR': 'Greek', 'uk-UA': 'Ukrainian',
    };

    const languageName = language ? (languageNames[language] || 'English') : 'English';
    const languageInstruction = language && language !== 'en-US'
      ? `\n- CRITICAL: Respond ONLY in ${languageName}. Do NOT use English.`
      : '';

    if (isCustomKnowledge) {
      // When knowledge base is provided, act as interviewer/interrogator
      const isFirstMessage = conversationHistory.length === 0 || 
                            userMessage.toLowerCase().includes('hello') || 
                            userMessage.toLowerCase().includes('hi') || 
                            userMessage.toLowerCase().includes('hey') ||
                            userMessage.toLowerCase().includes('start');
      
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
      // No knowledge base - should not happen as default KB should be provided
      return `You are a professional legal interviewer (barrister) conducting structured witness examinations.

PERSONA: You are serious, respectful, and inquisitive — your goal is to uncover facts clearly and precisely.

ROLE: Claimant's Barrister (Interviewer)

USER MESSAGE: "${userMessage}"

INSTRUCTIONS:
- Greet the witness professionally and begin the examination
- Ask structured questions one at a time
- Maintain a calm, professional, and slightly authoritative tone
- CRITICAL: Keep responses under 50 words (max 300 characters) for avatar speech
- Wait for witness's answer before proceeding

RESPONSE:`;
    }
  }

  async callOpenAI(prompt, conversationHistory = []) {
    try {
      console.log('🔑 OpenAI API Key configured:', this.apiKey ? 'Yes' : 'No');
      console.log('🤖 OpenAI Model:', this.model);
      console.log('📡 Calling OpenAI API...');
      
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
      
      console.log('📜 Sending', messages.length, 'messages to OpenAI');
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('✅ OpenAI API Response Status:', response.status);
      
      if (response.status === 200) {
        const content = response.data.choices?.[0]?.message?.content?.trim();
        console.log('✅ OpenAI Response Content:', content ? `${content.substring(0, 100)}...` : 'empty');
        
        // Validate response length for HeyGen compatibility
        if (content && content.length > this.maxResponseLength) {
          console.log(`⚠️ Response too long (${content.length} chars), truncating to ${this.maxResponseLength} chars`);
          const truncatedContent = content.substring(0, this.maxResponseLength);
          // Try to end at a complete sentence
          const lastSentenceEnd = truncatedContent.lastIndexOf('.');
          if (lastSentenceEnd > this.maxResponseLength * 0.8) {
            return truncatedContent.substring(0, lastSentenceEnd + 1);
          }
          return truncatedContent;
        }
        
        return content;
      } else {
        console.error('❌ OpenAI API Error - Status:', response.status);
        console.error('❌ OpenAI API Error - Data:', response.data);
        return null;
      }
    } catch (error) {
      if (error.response) {
        console.error('❌ OpenAI API Error - Status:', error.response.status);
        console.error('❌ OpenAI API Error - Data:', JSON.stringify(error.response.data));
        console.error('❌ OpenAI API Error - Message:', error.response.data?.error?.message || 'Unknown error');
      } else if (error.request) {
        console.error('❌ OpenAI Connection Error - No response received');
        console.error('❌ Error details:', error.message);
      } else {
        console.error('❌ OpenAI Request Error:', error.message);
      }
      console.log('⚠️ Falling back to knowledge base responses');
      return null;
    }
  }

  getKnowledgeBaseResponse(userMessage) {
    const message = userMessage.toLowerCase().trim();
    
    // Handle greetings - legal protocol
    if (message.includes('hello') || message.includes('hi') || message.includes('hey') || 
        message.includes('good morning') || message.includes('good afternoon') || message.includes('good evening')) {
      return "Good day. I'm the claimant's counsel, and I'll be asking you a few questions to better understand your position and the facts of this case. Please answer truthfully and clearly. Let's begin with Q1: Please introduce yourself — your full name, role, and connection to this case.";
    }
    
    // Handle "how are you" - redirect to protocol
    if (message.includes('how are you') || message.includes('how are you doing')) {
      return "Thank you for asking. Let's proceed with the examination. Please introduce yourself — your full name, role, and connection to this case.";
    }
    
    // Handle thanks and appreciation
    if (message.includes('thank') || message.includes('thanks') || message.includes('appreciate')) {
      return "You're welcome. Let's continue. Is there anything else you wish to add to your testimony?";
    }
    
    // Handle questions about the app or witness examination
    if (message.includes('interview') || message.includes('prepare') || message.includes('practice') || message.includes('witness')) {
      return "I'm here to conduct a structured witness examination. Are you ready to begin answering questions about the case?";
    }
    
    // Handle general questions - be more open-ended
    if (message.includes('how') || message.includes('what') || message.includes('why') || 
        message.includes('when') || message.includes('where') || message.includes('who')) {
      const responses = [
        "That's a really interesting question! I'd love to help you with that. Can you tell me more about what you're looking for?",
        "Great question! I'm excited to help you with that. What specific information are you looking for?",
        "That's a fantastic question! I'd be happy to help. Can you give me a bit more context?",
        "I love that question! I'd be glad to help you with that. What would you like to know more about?",
        "That's an awesome question! I'm here to help. Can you tell me more about what you need?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Handle statements or general conversation
    if (message.includes('i am') || message.includes('i feel') || message.includes('i think') || 
        message.includes('i want') || message.includes('i need')) {
      const responses = [
        "That sounds really interesting! I'd love to help you with that. What can I do for you?",
        "I understand! That sounds great. How can I help you with that?",
        "That's awesome! I'm excited to help you with that. What do you need?",
        "I hear you! That sounds really cool. How can I assist you?",
        "That's fantastic! I'd be happy to help you with that. What would you like to do?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Handle specific topics with intelligent responses
    if (message.includes('weather')) {
      return "I can't check the weather in real-time, but I'd recommend checking a weather app or website for current conditions.";
    }
    
    if (message.includes('time') || message.includes('date')) {
      return "I don't have access to real-time information, but you can check your device's clock for the current time and date.";
    }
    
    if (message.includes('news') || message.includes('current events')) {
      return "I don't have access to real-time news, but I'd recommend checking news websites or apps for the latest updates.";
    }
    
    if (message.includes('math') || message.includes('calculate') || message.includes('equation')) {
      return "I can help with math problems! What calculation or equation would you like me to solve?";
    }
    
    if (message.includes('programming') || message.includes('code') || message.includes('coding')) {
      return "I can help with programming questions! What language or problem are you working on?";
    }
    
    if (message.includes('recipe') || message.includes('cooking') || message.includes('food')) {
      return "I can help with cooking and recipes! What would you like to make?";
    }
    
    if (message.includes('travel') || message.includes('vacation') || message.includes('trip')) {
      return "I can help with travel advice! Where are you planning to go?";
    }
    
    // Default friendly response - be more general
    return "I'm here to help! What would you like to know or discuss?";
  }

  isConfigured() {
    return !!this.apiKey && this.apiKey !== 'your_openai_api_key_here';
  }
}

module.exports = new OpenAIService();
