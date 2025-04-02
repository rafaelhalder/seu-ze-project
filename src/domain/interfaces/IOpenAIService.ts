import type { Message } from "../entities/Message";

export interface IOpenAIService {
  extractMessageInformation(message:string): Promise<Record<string, any>>
}