export interface IMemoryService {
  saveKeyInformation(userId: string,userName:string, information: Record<string, any>): Promise<void>;
  getUserHistory(userId: string): Promise<Record<string, string>>;
  saveSentiment(userId: string, sentiment: number): Promise<void>
  updateEmotionalProfile(remoteJid: string): Promise<void>;
  getEmotionalProfile(remoteJid: string):Promise<Record<string, string>>;
  // Other memory-related operations
}