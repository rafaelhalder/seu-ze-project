import { env } from "@/env";
import { WebSocketClient } from "@/infrastructure/websocket/WebSocketClient";
import { MessageHandlerService } from "@/application/services/MessageHandlerService";
import { PrismaMessageRepository } from "@/infrastructure/database/repositories/PrismaMessageRepository";

const webSocketClient = new WebSocketClient(env.EVOLUTION_URL_WITH_INSTANCE);
const messageRepository = new PrismaMessageRepository();
const messageHandlerService = new MessageHandlerService(
  messageRepository
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