export interface IOpenAIService {
  extractMessageInformation(message:string): Promise<Record<string, any>>
  analyzeSentiment(message: string, previousMessages?: string[]): Promise<{
    irony: any;
    score: number;         // -1 to 1 (negative to positive)
    label: string;         // "positive", "negative", "neutral", "mixed"
    confidence: number;    // 0 to 1
    dominantEmotions?: string[]; // Optional array of emotions
  }>;
  generateResponse(params: {
    messageId: string;
    userMessage: string;
    userContext: any;
    conversationHistory: any[];
    sentiment: any;
    emotionalProfile: any;
  }): Promise<string>;
}