import type { Message } from "@/domain/entities/Message";
import type { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import {prisma} from '../prisma/prisma'

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
}