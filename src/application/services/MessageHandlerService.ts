import { Message, MessageType } from "@/domain/entities/Message";
import type { IMessegeHandlerService } from "@/domain/interfaces/IMessageHandlerService";
import type { IMessageRepository } from "@/domain/interfaces/IMessageRepository";

export class MessageHandlerService implements IMessegeHandlerService{
  constructor(
    private messageRepository: IMessageRepository,
  ){}


  async handleMessage(message: Message): Promise<void> {
    // Aqui você pode implementar a lógica para lidar com a mensagem recebida
    // console.log("Mensagem recebida:", message);
    const formattedMessage = this.convertToMessageEntity(message); // Converte a mensagem para a entidade Message
    if (!formattedMessage) {
      console.error('Mensagem inválida ou não suportada');
      return;
    }
    this.messageRepository.save(formattedMessage); // Salva a mensagem no banco de dados
    // Por exemplo, você pode enviar a mensagem para o WhatsApp ou gerar uma resposta

    if(!this.shouldRespondToMessage(message)){
      return;
    }

    if(message.type === MessageType.TEXT){
      await this.proccessMessageInformation(message);

    }

  }

  private shouldRespondToMessage(message: Message): boolean {
    if(message.fromMe){
      return false
    }
  
  if(message.remoteJid.includes('@g.us')){
    return false
  }

  return true
}

  private proccessMessageInformation(message: Message): Promise<String | void> {
    // Aqui você pode implementar a lógica para processar a mensagem
    // Por exemplo, você pode analisar o conteúdo da mensagem e gerar uma resposta
    console.log("Processando mensagem:", message);
    return Promise.resolve();
  
  }

  private convertToMessageEntity(evolutionData: any): Message | null {
    try {
      // Verificar se a estrutura básica existe
      if (!evolutionData || !evolutionData.data || !evolutionData.data.key) {
        console.warn('Estrutura de mensagem inválida');
        return null;
      }
      
      const { data } = evolutionData;
      let messageType = MessageType.UNKNOWN;
      let content = '';
      
      // Determinar tipo de mensagem e extrair conteúdo
      if (data.messageType === 'conversation' && data.message?.conversation) {
        messageType = MessageType.TEXT;
        content = data.message.conversation;
      } 
      else if (data.messageType === 'stickerMessage' && data.message?.stickerMessage) {
        messageType = MessageType.STICKER;
        content = 'Sticker';
      }
      else if (data.messageType === 'audioMessage' && data.message?.audioMessage) {
        messageType = MessageType.AUDIO;
        content = 'Mensagem de áudio recebida';
      }
      else if (data.message?.imageMessage) {
        messageType = MessageType.IMAGE;
        content = data.message.imageMessage.caption || 'Imagem recebida';
      }
      else if (data.message?.videoMessage) {
        messageType = MessageType.VIDEO;
        content = data.message.videoMessage.caption || 'Vídeo recebido';
      }
      else if (data.message?.documentMessage) {
        messageType = MessageType.DOCUMENT;
        content = data.message.documentMessage.fileName || 'Documento recebido';
      }
      
      // Criar e retornar entidade Message
      return new Message({
        id: data.key.id,
        remoteJid: data.key.remoteJid,
        fromMe: data.key.fromMe,
        pushName: data.pushName,
        timestamp: new Date(data.messageTimestamp * 1000),
        type: messageType,
        content: content,
        rawData: data // Guardar dados brutos para referência futura
      });
      
    } catch (error) {
      console.error('Erro ao converter mensagem:', error);
      return null;
    }
  }
}