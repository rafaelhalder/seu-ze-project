import type { Message } from "@/domain/entities/Message";
import type { IMessegeHandlerService } from "@/domain/interfaces/IMessageHandlerService";

export class MessageHandlerService implements IMessegeHandlerService{


  async handleMessage(message: Message): Promise<void> {
    // Aqui você pode implementar a lógica para lidar com a mensagem recebida
    console.log("Mensagem recebida:", message);
    // Por exemplo, você pode enviar a mensagem para o WhatsApp ou gerar uma resposta

  }
}