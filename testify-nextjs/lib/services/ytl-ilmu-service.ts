import axios from 'axios';

interface YTLIlmuMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface YTLIlmuResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class YTLIlmuService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.YTL_ILMU_API_KEY || '';
    this.baseUrl = process.env.YTL_ILMU_BASE_URL || 'https://api.ytlailabs.tech';
    this.model = process.env.YTL_ILMU_MODEL || 'ilmu-trial';
    this.maxTokens = parseInt(process.env.YTL_ILMU_MAX_TOKENS || '2000');
    this.temperature = parseFloat(process.env.YTL_ILMU_TEMPERATURE || '0.3');
    this.enabled = process.env.USE_YTL_ILMU === 'true';
  }

  async processMessage(
    message: string,
    conversationHistory: YTLIlmuMessage[] = [],
    knowledgeBaseContent?: string
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    if (!this.enabled || !this.apiKey) {
      return {
        success: false,
        error: 'YTL ILMU service not configured or disabled',
      };
    }

    try {
      const messages: YTLIlmuMessage[] = [];

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

      const response = await axios.post<YTLIlmuResponse>(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: this.model,
          messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        response: response.data.choices[0].message.content,
      };
    } catch (error: any) {
      console.error('YTL ILMU API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to process message with YTL ILMU',
      };
    }
  }

  isConfigured(): boolean {
    return this.enabled && !!this.apiKey;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('YTL ILMU health check failed:', error);
      return false;
    }
  }
}

export const ytlIlmuService = new YTLIlmuService();

