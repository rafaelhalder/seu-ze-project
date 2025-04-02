import type { Message} from "@/domain/entities/Message";
import type { IOpenAIService } from "@/domain/interfaces/IOpenAIService";
import { openai as openaiModel } from '@ai-sdk/openai';
import { deepseek as deepseekModal } from '@ai-sdk/deepseek';
import { generateText } from "ai";

export class OpenAIService implements IOpenAIService {
  private openai = openaiModel('gpt-3.5-turbo')
  private deepseek = deepseekModal("deepseek-chat")
  async extractMessageInformation(message: string): Promise<Record<string, any>> {
    try {
      const response = await generateText({
        model: this.openai,
        prompt: message,
        tools: {},
        system: `
        Extraia as informações mais relevantes da seguinte mensagem, com foco nos seguintes pontos:
        - **Datas importantes** (como aniversários, casamentos, eventos)
        - **Nomes de pessoas** mencionadas (como familiares, amigos, colegas, etc.)
        - **Preferências pessoais** (ex.: gostos, hobbies, escolhas pessoais)
        - **Locais importantes** (como cidades, países, lugares significativos)
    
        **Requisitos:**
        - Se não houver informações relevantes, retorne um objeto JSON vazio \`{}\`.
        - Se houver informações relevantes, retorne um objeto JSON com os dados encontrados.
        - Sempre escreva a resposta em formato **markdown**, sem usar formatação de código (sem os sinais de backticks \`\`\`).
    
        **Exemplo de resposta:**
        - Entrada: "Hoje é aniversário da Maria, meu aniversário é dia 15/05 e o casamento será em Paris."
        - Saída:
        \`\`\`
        {
          "aniversario": "15/05",
          "nome_conjuge": "Maria",
          "local_casamento": "Paris"
        }
        \`\`\``,
        maxTokens: 300,
        temperature: 0.3,
        maxSteps: 5,
      })

      const responseText = response.text.trim().replace(/```json|```/g, "");

      const content = responseText || "{}";
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error('Erro ao parsear resposta JSON:', e);
        return {};
      }

    } catch (error) {
      console.error('Erro ao extrair informações:', error);
      return {};
    }
  }
  
}