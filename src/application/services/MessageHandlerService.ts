import { Message, MessageType } from "@/domain/entities/Message";
import type { IMemoryService } from "@/domain/interfaces/IMemoryService";
import type { IMessegeHandlerService } from "@/domain/interfaces/IMessageHandlerService";
import type { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import type { IOpenAIService } from "@/domain/interfaces/IOpenAIService";
import { env } from "@/env";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

export class MessageHandlerService implements IMessegeHandlerService{
  private prisma: PrismaClient;
  constructor(
    private messageRepository: IMessageRepository,
    private openAIService: IOpenAIService,
    private memoryService: IMemoryService,
  ){
    this.prisma = new PrismaClient();
  }


  async handleMessage(message: any): Promise<void> {
    // Aqui você pode implementar a lógica para lidar com a mensagem recebida
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
        await this.memoryService.saveKeyInformation(message.remoteJid, message.pushName, keyInformation);
      }

      if (sentimentAnalysis && sentimentAnalysis.dominantEmotions) {
        await this.updateMessageSentiment(message.id, sentimentAnalysis);

        const messageCount = await this.prisma.message.count({
          where: {
            remoteJid: message.remoteJid,
            fromMe: false,
            answered: false
          }
        })
        if(messageCount % 5 === 0){
          await this.memoryService.updateEmotionalProfile(message.remoteJid);
        }
      }

      const responseText = await this.generateResponse(message, sentimentAnalysis);

      const responseFormatted = { 
        ...message, 
        id: message.id + '-response',
        fromMe: true ,
        content: responseText, 
        rawData: { 
          ...message.rawData, 
          key: { 
        ...message.rawData.key, 
          } 
        } 
      };

    this.messageRepository.save(responseFormatted); // Salva a mensagem no banco de dados
    await this.prisma.message.update({
      where: { id: message.id },
      data: { answered: true }
    });

    await this.sendMessage(responseFormatted.remoteJid, responseFormatted.content);

    } catch(error) {
      console.error('Erro ao processar informações da mensagem:', error);
    }
  }
  public async sendMessage(phoneNumber: string, message: string): Promise<void>{
    try{
      const formattedPhone = phoneNumber.includes('@')? phoneNumber.split('@')[0]: phoneNumber;
      const response = await axios.post(env.URL_SEND_MESSAGE_WHATSAPP, {
        number: formattedPhone,
        text: message
      },{
        headers:{
          'Content-Type': 'application/json',
          'apikey': env.APIKEY
        }
      })
      return response.data;
    }catch(error){
      console.error('Erro ao enviar mensagem:', error);
    }
  }
  async updateMessageSentiment(
    messageId: string, 
    sentiment: {
       score: number;
        label: string;
         confidence: number;
          dominantEmotions?: string[];
            irony?: {
              detected: boolean;
              confidence: number;
              explanation: string;
            };
         }
  ): Promise<void> {
    try {
      // Format emotions as JSON array
      const emotionsJson = sentiment.dominantEmotions?.map((emotion, index) => {
        // Calculate intensity based on position (first emotions are stronger)
        const intensity = Math.max(0.1, 1 - (0.2 * index));
        const explanation = `Emotion detected: ${emotion}`;
        return { name: emotion, intensity, explanation };
      });

      const sentimentData = {
        sentiment: sentiment.score,
        emotions: emotionsJson ? JSON.stringify(emotionsJson) : null
      }

      if(sentiment.irony?.detected && sentiment.irony.confidence > 0.5){
        const emotions = emotionsJson || [];
        emotions.unshift({
          name: 'irony',
          intensity: sentiment.irony.confidence,
          explanation: sentiment.irony.explanation || "Ironia detected"
        });
        sentimentData.emotions = JSON.stringify(emotions);
      }

      // Update the message with consolidated sentiment data
      await this.prisma.message.update({
        where: { id: messageId },
        data: sentimentData
      });
      
    } catch (error) {
      console.error('Error updating message sentiment:', error);
      throw new Error('Failed to update message sentiment');
    }
  }

  private convertToMessageEntity(evolutionData: any): Message | null {
    try {
      // Verificar se a estrutura básica existe
      if (!evolutionData || !evolutionData.event) {
        console.warn('Estrutura de mensagem inválida');
        return null;
      }
      
      const { data,event } = evolutionData;
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
        eventType: event,
        timestamp: new Date(data.messageTimestamp * 1000),
        type: messageType,
        content: content,
        rawData: data
      });
      
    } catch (error) {
      console.error('Erro ao converter mensagem:', error);
      return null;
    }
  }

  private async generateResponse(message: Message, sentimentAnalysis:any): Promise<string>{
    try{
      const userContext = await this.memoryService.getUserHistory(message.remoteJid);
      const userEmotionalProfile = await this.memoryService.getEmotionalProfile(message.remoteJid);
      const recentMessages = await this.messageRepository.getRecentMessages(message.remoteJid, 10);
      const messageHistory = recentMessages.map(m => ({
        content: m.content,
        fromMe: m.fromMe
      }));

    const response = await this.openAIService.generateResponse({
      messageId: message.id,
      userMessage: message.content,
      userContext: userContext,
      conversationHistory: messageHistory,
      sentiment: sentimentAnalysis,
      emotionalProfile: userEmotionalProfile
    });
    return response;
      
    }catch(error){
      console.error('Erro ao gerar resposta:', error);
      return 'Desculpe, não consegui processar sua mensagem.';
    }
  }
}