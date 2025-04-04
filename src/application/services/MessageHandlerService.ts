import { Message, MessageType } from "@/domain/entities/Message";
import type { IMemoryService } from "@/domain/interfaces/IMemoryService";
import type { IMessegeHandlerService } from "@/domain/interfaces/IMessageHandlerService";
import type { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import type { IOpenAIService } from "@/domain/interfaces/IOpenAIService";
import { PrismaClient } from "@prisma/client";

export class MessageHandlerService implements IMessegeHandlerService{
  private prisma: PrismaClient;
  constructor(
    private messageRepository: IMessageRepository,
    private openAIService: IOpenAIService,
    private memoryService: IMemoryService,
  ){
    this.prisma = new PrismaClient();
  }


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

    if(!this.shouldRespondToMessage(formattedMessage)){
      return;
    }

    if(formattedMessage.type === MessageType.TEXT){
      await this.proccessMessageInformation(formattedMessage);

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

  private async proccessMessageInformation(message: Message): Promise<void> {
    try {
      // Obter mensagens anteriores da conversa
      const recentMessages = await this.messageRepository.getRecentMessages(
        message.remoteJid,
        5  // Últimas 5 mensagens
      );
      
      // Extrair apenas o conteúdo das mensagens
      const messageHistory = recentMessages.map(m => m.content);
      
      // Analisar com contexto
      const [keyInformation, sentimentAnalysis] = await Promise.all([
        this.openAIService.extractMessageInformation(message.content),
        this.openAIService.analyzeSentiment(message.content, messageHistory)
      ]);
      
      // Salvar informações extraídas
      if (Object.keys(keyInformation).length > 0) {
        console.log(' irá salvar');
        await this.memoryService.saveKeyInformation(message.remoteJid, message.pushName, keyInformation);
      }

      if (sentimentAnalysis && sentimentAnalysis.dominantEmotions && sentimentAnalysis.dominantEmotions?.length > 0) {
        await this.updateMessageSentiment(message.id, sentimentAnalysis);
      }

      // Verificar ironia
      if (sentimentAnalysis?.irony?.detected && sentimentAnalysis.irony.confidence > 0.7) {
        console.log('Ironia detectada!', sentimentAnalysis.irony);
        // Lógica adicional para lidar com ironia
      }

      console.log('Informações extraídas:', keyInformation);

      const responseText = await this.generateResponse(message, keyInformation, sentimentAnalysis);
      console.log('Resposta gerada:', responseText);

    } catch(error) {
      console.error('Erro ao processar informações da mensagem:', error);
    }
  }

  async updateMessageSentiment(messageId: string, 
    sentiment: { score: number; label: string; confidence: number; dominantEmotions?: string[] }
  ): Promise<void> {
    try{
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          sentimentScore: sentiment.score,
          sentimentLabel: sentiment.label,
          sentimentConfidence: sentiment.confidence,
          // If you want to save emotions too, you'd need additional logic here
        }
      });
          // 2. Salvar as emoções dominantes, se existirem
    if (sentiment.dominantEmotions && sentiment.dominantEmotions.length > 0) {
      // Criar um registro para cada emoção
      const emotionPromises = sentiment.dominantEmotions.map((emotion, index) => {
        // Calcular uma intensidade aproximada com base na posição no array
        // Primeira emoção tem intensidade maior, as seguintes têm menos
        const intensity = 1 - (0.2 * index); 
          console.log(`intensity:`+ Math.max(0.1, intensity));
        return this.prisma.messageEmotion.create({
          data: {
            messageId,
            emotion,
            intensity: Math.max(0.1, intensity) // Garantir que é pelo menos 0.1
          }
        });
      });
      
      await Promise.all(emotionPromises);
    }
    }catch(error){
      console.error('Error updating message with sentiment:', error);
    }
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

  private async generateResponse(message: Message, keyInformation: any, sentimentAnalysis:any): Promise<string>{
    try{
      const userContext = await this.memoryService.getUserHistory(message.remoteJid);
      const recentMessages = await this.messageRepository.getRecentMessages(message.remoteJid, 5);
      const messageHistory = recentMessages.map(m => ({
        content: m.content,
        fromMe: m.fromMe,
        timestamp: m.timestamp
      }));

    const response = await this.openAIService.generateResponse({
      userMessage: message.content,
      userContext: userContext,
      conversationHistory: messageHistory,
      keyInformation: keyInformation,
      sentiment: sentimentAnalysis
    });
    return response;
      
    }catch(error){
      console.error('Erro ao gerar resposta:', error);
      return 'Desculpe, não consegui processar sua mensagem.';
    }
  }
}