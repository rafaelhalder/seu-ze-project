import type { IOpenAIService } from "@/domain/interfaces/IOpenAIService";

export class OpenAIService implements IOpenAIService {
  async extractMessageInformation(message: any): Promise<void> {
    // Implement the logic to extract message information using OpenAI API
    // For example, you can use the OpenAI API client to send a request and get a response
    console.log("Extracting message information:", message);
    // Simulate an API call with a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Message information extracted successfully.");
  }
  
}