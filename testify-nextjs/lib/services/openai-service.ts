import axios from 'axios';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '80');
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');
  }

  async processMessage(
    message: string,
    conversationHistory: OpenAIMessage[] = [],
    knowledgeBaseContent?: string,
    jsonMode: boolean = false
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    try {
      const messages: OpenAIMessage[] = [];

      // Add system message with knowledge base if provided
      if (knowledgeBaseContent) {
        messages.push({
          role: 'system',
          content: `You are a professional interviewer conducting a witness interview. Use the following knowledge base to inform your questions and responses:\n\n${knowledgeBaseContent}`,
        });
      } else {
        messages.push({
          role: 'system',
          content: 'You are a professional interviewer conducting a witness interview. Ask clear, relevant questions and provide constructive feedback.',
        });
      }

      // Add conversation history
      messages.push(...conversationHistory);

      // Add current message
      messages.push({
        role: 'user',
        content: message,
      });

      const requestBody: any = {
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      };

      // Enable JSON mode if requested (only works with gpt-4-turbo-preview and later)
      if (jsonMode) {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await axios.post<OpenAIResponse>(
        'https://api.openai.com/v1/chat/completions',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        success: true,
        response: response.data.choices[0].message.content,
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to process message with OpenAI',
      };
    }
  }

  async transcribeAudio(audioFile: Buffer): Promise<{ success: boolean; text?: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    try {
      const formData = new FormData();
      // Convert Buffer to Blob - use type assertion to bypass TypeScript check
      const audioBlob = new Blob([audioFile as any], { type: 'audio/webm' });
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        success: true,
        text: response.data.text,
      };
    } catch (error: any) {
      console.error('Whisper API error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to transcribe audio',
      };
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const openaiService = new OpenAIService();

