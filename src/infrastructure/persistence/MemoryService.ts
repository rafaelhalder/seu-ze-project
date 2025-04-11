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

      // await prisma.userSentiment.create({
      //   data: {
      //     userId: user.id,
      //     date: new Date(),
      //     sentiment: sentiment
      //   }
      // });
    } catch (error) {
      console.error('Erro ao salvar sentimento:', error);
    }
  }

  async updateEmotionalProfile(remoteJid: string): Promise<void> {
    try {
      // Find or create user
      const user = await prisma.user.findUnique({
        where: { phoneNumber: remoteJid }
      });
      
      if (!user) return;
      
      // Get recent messages to analyze emotional patterns
      const recentMessages = await prisma.message.findMany({
        where: { userId: user.id },
        orderBy: { dateTime: 'desc' },
        take: 100, // Analyze last 100 messages
        select: { sentiment: true, emotions: true }
      });
      
      if (recentMessages.length === 0) return;
      
      // Calculate baseline sentiment (average)
      const sentiments = recentMessages
        .filter(msg => msg.sentiment !== null)
        .map(msg => msg.sentiment as number);
        
      const baselineSentiment = sentiments.length > 0 
        ? sentiments.reduce((sum, val) => sum + val, 0) / sentiments.length
        : 0;
      
      // Aggregate emotions data
      const allEmotions: Record<string, number> = {};
      recentMessages.forEach(msg => {
        if (!msg.emotions) return;
        
        try {
          const emotions = JSON.parse(msg.emotions);
          emotions.forEach((emotion: {name: string, intensity: number}) => {
            if (!allEmotions[emotion.name]) {
              allEmotions[emotion.name] = 0;
            }
            allEmotions[emotion.name] += emotion.intensity;
          });
        } catch (e) {
          // Skip invalid JSON
        }
      });
      
      // Find most common emotions
      const commonEmotions = Object.entries(allEmotions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, strength]) => ({ name, strength }));
      
      // Upsert emotional profile
      await prisma.emotionalProfile.upsert({
        where: { userId: user.id },
        update: {
          baselineSentiment,
          preferenceData: JSON.stringify(commonEmotions[0]), 
          commonEmotions: JSON.stringify(commonEmotions),
          lastUpdated: new Date()
        },
        create: {
          userId: user.id,
          baselineSentiment,
          commonEmotions: JSON.stringify(commonEmotions),
        }
      });
      
    } catch (error) {
      console.error('Error updating emotional profile:', error);
    }
  }

  async saveKeyInformation(userId: string, userName: string, information: Record<string, any>): Promise<void> {
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
        if (key === 'nomes_mencionados') {
          // Retrieve existing value for 'nomes_mencionados'
          const existingMetadata = await prisma.userMetadata.findUnique({
        where: {
          userId_key: {
            userId: user.id,
            key: key
          }
        }
          });

          let existingNames: string[] = [];
          if (existingMetadata && existingMetadata.value) {
        try {
          existingNames = JSON.parse(existingMetadata.value);
        } catch (e) {
          console.error('Erro ao parsear nomes_mencionados:', e);
        }
          }

          // Ensure value is an array and concatenate unique names
          const newNames = Array.isArray(value) ? value : [value];
          const updatedNames = Array.from(new Set([...existingNames, ...newNames]));

          await prisma.userMetadata.upsert({
        where: {
          userId_key: {
            userId: user.id,
            key: key
          }
        },
        update: {
          value: JSON.stringify(updatedNames)
        },
        create: {
          userId: user.id,
          key: key,
          value: JSON.stringify(updatedNames)
        }
          });
        } else {
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
      }
    } catch (error) {
      console.error('Erro ao salvar informações da conversa:', error);
    };
  }

  async getEmotionalProfile(remoteJid: string): Promise<Record<string,string>> {
    try {
      // Buscar usuário
      const user = await prisma.user.findFirst({
        where: {
          phoneNumber: remoteJid
        },
        include: {
          emotionalProfile: true
        }
      });
      
      if (!user || !user.emotionalProfile) return {};
      
      const profile = user.emotionalProfile;
      console.log('Perfil emocional:',  String(profile.commonEmotions));
      console.log('Perfil emocional:',  String(profile.preferenceData));
      return {
        commonEmotions: String(profile.commonEmotions),
        preferenceData: String(profile.preferenceData),
      };
    } catch (error) {
      console.error('Erro ao recuperar perfil emocional:', error);
      return {};
    };
  }

  async getUserHistory(remoteJid: string): Promise<Record<string, string>> {
    try {
      // Buscar usuário
      const user = await prisma.user.findFirst({
        where: {
          phoneNumber: remoteJid
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