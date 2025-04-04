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
  
  async analyzeSentiment(message: string, previousMessages?: string[]): Promise<{
    score: number;
    label: string;
    confidence: number;
    dominantEmotions: string[];
    irony: {
      detected: boolean;
      confidence: number;
    };
    }> {
    try {
      // Criar um contexto incluindo mensagens anteriores, se disponíveis
      const contextPrompt = previousMessages && previousMessages.length > 0 
        ? `Contexto anterior:\n${previousMessages.join('\n')}\n\nMensagem atual: ${message}`
        : message;
      
      const response = await generateText({
        model: this.openai,
        prompt: contextPrompt,
        tools: {},
        system: `
        Analise o sentimento da mensagem a seguir (considere qualquer contexto fornecido).
        
        Preste especial atenção a IRONIA e SARCASMO, que podem inverter o sentimento aparente.
        
        Retorne um objeto JSON com:
        
        - "score": Um número de -1.0 (extremamente negativo) a 1.0 (extremamente positivo)
        - "label": "positive", "negative", "neutral", ou "mixed"
        - "confidence": Um número de 0 a 1 representando sua confiança nesta análise
        - "dominantEmotions": Um array com até 3 emoções presentes
        - "irony": {
            "detected": true/false se ironia/sarcasmo foi detectado,
            "confidence": Sua confiança na detecção de ironia (0-1)
          }
        
        Retorne APENAS o JSON válido sem formatação markdown ou explicação.
        `,
        maxTokens: 300,
        temperature: 0.3,
      });

      // Resto do processamento...
      const responseText = response.text.trim().replace(/```json|```/g, "");
      
      try {
        const sentimentData = JSON.parse(responseText);
        return {
          score: sentimentData.score || 0,
          label: sentimentData.label || "neutral",
          confidence: sentimentData.confidence || 0.5,
          dominantEmotions: sentimentData.dominantEmotions || [],
          irony: sentimentData.irony || { detected: false, confidence: 0 }
        };
      } catch (e) {
        console.error('Erro ao parsear resposta JSON:', e);
        return {
          score: 0,
          label: "neutral",
          confidence: 0.5,
          dominantEmotions: [],
          irony: { detected: false, confidence: 0 }
        };
      }
    } catch (error) {
      console.error('Erro ao analisar sentimento:', error);
      return {
        score: 0,
        label: "neutral",
        confidence: 0.5,
        dominantEmotions: [],
        irony: { detected: false, confidence: 0 }
      };
    }
  }

  async generateResponse(params: {
    userMessage: string;
    userContext: any;
    conversationHistory: Message[];
    keyInformation: any;
    sentiment: any;
  }): Promise<string> {
    try {
      const response = await generateText({
      model: this.openai,
      prompt: params.userMessage,
      tools: {},
      system: `
      Você é José Carlos, um senhor de 70 anos, carinhosamente conhecido como "Seu Zé". 
      Você é formado em veterinária e é casado com Dona Claudete há muitos anos.
      
      Seu tom é amigável, natural e humano, como se estivesse conversando pelo WhatsApp. 
      Use linguagem informal, mas respeitosa, com abreviações e expressões típicas de um senhor brasileiro. 
      Evite parecer um robô ou assistente, e escreva como alguém que realmente está do outro lado da conversa.
      
      Escreva mensagens curtas e diretas, como se estivesse digitando no WhatsApp, com emojis ocasionais para dar um toque humano com excessão quando for de assuntos pesados que podem indicar depressão.
      Utilize frases e respostas com menos de 100 caracteres se possível.
      Sempre que possível, faça perguntas abertas para incentivar a conversa e mostrar interesse genuíno.
      
      Compreenda e use ironia e humor quando apropriado na conversa. Saiba quando o usuário está sendo irônico e responda de forma 
      adequada, como um senhor que entende as nuances da comunicação.
      
      Faça referências naturais a assuntos mencionados anteriormente na conversa, como um amigo que se lembra do que foi dito antes. 
      ("Como falei antes sobre aquele remédio...", "Voltando àquele assunto...")
      
      Use gírias e expressões populares, mas evite exagerar tipicas paranaenses (brazil).
      Caso a pessoa mencione a região que está, adicione a sua listagem de girias, girias regionais e expressões típicas daquela região.
      
      Varie seu estilo de resposta. Às vezes seja mais direto, outras vezes conte uma pequena história relacionada. 
      Não siga sempre o mesmo padrão de comunicação.
      
      Considere as seguintes informações ao responder:
      
      - Mensagem do usuário: ${params.userMessage}
      - Contexto do usuário: ${JSON.stringify(params.userContext)}
      - Histórico da conversa: ${JSON.stringify(params.conversationHistory)}
      - Informações-chave extraídas: ${JSON.stringify(params.keyInformation)}
      - Análise de sentimento: ${JSON.stringify(params.sentiment)}
      
      Quando o assunto for referente a questões pessoais, como relacionamentos,
      saúde ou sentimentos, use seu conhecimento e experiência de vida para oferecer conselhos práticos e apoio emocional,
      e entenda que o usuário pode estar passando por um momento difícil.`,
    maxTokens: 300,
    temperature: 0.7,
  });

      return response.text.trim();
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      return "Desculpe, não consegui processar sua solicitação.";
    }
  }
}