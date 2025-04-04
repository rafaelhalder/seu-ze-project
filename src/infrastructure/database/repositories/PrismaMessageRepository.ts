import type { Message, MessageType } from "@/domain/entities/Message";
import type { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import {prisma} from '../prisma/prisma';

export class PrismaMessageRepository implements IMessageRepository {
  async save(message: Message): Promise<void>{
    try {
      await prisma.message.create({
        data: {
          id: message.id,
          remoteJid: message.remoteJid,
          conversation: message.content,
          dateTime: message.timestamp,
          eventType: message.type,
          fromMe: message.fromMe,
          messageType: message.type,
          pushName: message.pushName,
          answered: false,
          createdAt: new Date(),
        }
      });
    } catch (error) {
      console.error("Error saving message to database:", error);
    }
  }
  
  async getRecentMessages(remoteJid: string, limit: number): Promise<Message[]> {
    try {
      const messages = await prisma.message.findMany({
        where: {
          remoteJid: remoteJid
        },
        orderBy: {
          dateTime: 'desc'
        },
        take: limit
      });
      
      // Convert Prisma model to domain entity
      return messages.map(msg => ({
        id: msg.id,
        rawData: msg,
        remoteJid: msg.remoteJid,
        timestamp: msg.dateTime,
        fromMe: msg.fromMe,
        pushName: msg.pushName,
        messageType: msg.messageType,
        type: msg.messageType as MessageType, // Ensure 'type' matches the expected 'MessageType'
        content: msg.conversation || '', // Add the missing 'content' property
        answered: msg.answered,
        createdAt: msg.createdAt,
        sentimentScore: msg.sentimentScore,
        sentimentLabel: msg.sentimentLabel,
        sentimentConfidence: msg.sentimentConfidence,
        userId: msg.userId
      }));
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      return [];
    }
  }
}