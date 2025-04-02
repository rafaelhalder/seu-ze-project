import type { IMemoryService } from "@/domain/interfaces/IMemoryService";
import { prisma } from "../database/prisma/prisma";

export class MemoryService implements IMemoryService {

  public async saveSentiment(userId: string, sentiment: number): Promise<void> {
    try {
      // Verificar se o usuário já existe
      let user = await prisma.user.findFirst({
        where: {
          phoneNumber: userId
        }
      });
      
      if (!user) return;
      
      // Salvar sentimento
      await prisma.userSentiment.create({
        data: {
          userId: user.id,
          date: new Date(),
          sentiment: sentiment
        }
      });
    } catch (error) {
      console.error('Erro ao salvar sentimento:', error);
    }
  }

  async saveKeyInformation(userId: string, userName:string, information: Record<string, any>): Promise<void> {
    try {
      // Verificar se o usuário já existe
      let user = await prisma.user.findFirst({
        where: {
          phoneNumber: userId
        }
      });
      
      // Se não existe, criar
      if (!user) {
        user = await prisma.user.create({
          data: {
            phoneNumber: userId,
            name: userName
          }
        });
      }
      
      // Para cada informação extraída, atualizar ou criar
      for (const [key, value] of Object.entries(information)) {
        await prisma.userMetadata.upsert({
          where: {
            userId_key: {
              userId: user.id,
              key: key
            }
          },
          update: {
            value: String(value)
          },
          create: {
            userId: user.id,
            key: key,
            value: String(value)
          }
        });
      }
    } catch (error) {
      console.error('Erro ao salvar informações da conversa:', error);
    };
  }

  async getUserHistory(userId: string): Promise<Record<string, string>> {
    try {
      // Buscar usuário
      const user = await prisma.user.findFirst({
        where: {
          phoneNumber: userId
        },
        include: {
          metadata: true
        }
      });
      
      if (!user) return {};
      const information: Record<string, string> = {};
      
      if (user.metadata) {
        user.metadata.forEach(meta => {
          information[meta.key] = meta.value;
        });
      }
      
      return information;
    } catch (error) {
      console.error('Erro ao recuperar informações do usuário:', error);
      return {};
    };
  }
}