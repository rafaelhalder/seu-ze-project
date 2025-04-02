import { env } from "@/env";
import { WebSocketClient } from "@/infrastructure/websocket/WebSocketClient";
import { MessageHandlerService } from "@/application/services/MessageHandlerService";
import { PrismaMessageRepository } from "@/infrastructure/database/repositories/PrismaMessageRepository";
import { OpenAIService } from "@/infrastructure/ai/OpenAIService";
import { MemoryService } from "@/infrastructure/persistence/MemoryService";

const webSocketClient = new WebSocketClient(env.EVOLUTION_URL_WITH_INSTANCE);
const openAIService = new OpenAIService();
const messageRepository = new PrismaMessageRepository();
const memoryService = new MemoryService();

const messageHandlerService = new MessageHandlerService(
  messageRepository,
  openAIService,
  memoryService
);

function setupApplicationEventHandlers(): void{
  webSocketClient.on("connected",() => {
    console.log("Conectado ao WebSocket");
  });

  webSocketClient.on("message", (data) => {
    messageHandlerService.handleMessage(data)
  })
}

function initializeServices(): void {
  webSocketClient.connect();
  setupApplicationEventHandlers();
}

export { webSocketClient, initializeServices };