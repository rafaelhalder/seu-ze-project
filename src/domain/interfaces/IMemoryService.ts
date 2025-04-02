export interface IMemoryService {
  saveKeyInformation(userId: string,userName:string, information: Record<string, any>): Promise<void>;
  getUserHistory(userId: string): Promise<Record<string, string>>;
  saveSentiment(userId: string, sentiment: number): Promise<void>
  // Other memory-related operations
}