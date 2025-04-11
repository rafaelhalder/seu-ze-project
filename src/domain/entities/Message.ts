export enum MessageType{
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT = 'contact',
  UNKNOWN = 'unknown'
}

export class Message{
  id: string;
  remoteJid: string; // Número ou grupo que recebeu/enviou a mensagem
  fromMe: boolean;   // Se a mensagem foi enviada pelo bot ou não
  pushName: string; // Nome de contato de quem enviou
  timestamp: Date;
  type: MessageType;
  eventType: string; // Tipo de evento (ex: "message", "reaction", etc.)
  content: string;   // Texto ou descrição do conteúdo
  rawData: any;      // Dados brutos para referência futura
  
    constructor(data: Partial<Message>) {
      this.id = data.id || '';
      this.remoteJid = data.remoteJid || '';
      this.fromMe = data.fromMe || false;
      this.pushName = data.pushName || '';
      this.timestamp = data.timestamp || new Date();
      this.eventType = data.eventType || '';
      this.type = data.type || MessageType.UNKNOWN;
      this.content = data.content || '';
      this.rawData = data.rawData;
    }
}
