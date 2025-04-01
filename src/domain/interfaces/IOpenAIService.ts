import type { Message } from "../entities/Message";

export interface IOpenAIService {
  extractMessageInformation(message:Message): Promise<void>
}