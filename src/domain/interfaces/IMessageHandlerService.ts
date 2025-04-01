import type { Message } from "../entities/Message";

export interface IMessegeHandlerService {
  handleMessage(message: Message): Promise<void>;
  // sendMessageToEvolution(message: string): Promise<void>;
  // sendMessageToWhatsApp(message: string): Promise<void>;
  // generateResponse(message: string): Promise<string>;
  // handleError(error: Error): void;
  // handleSuccess(response: string): void;
}