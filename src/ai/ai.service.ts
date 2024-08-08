import { AzureKeyCredential, OpenAIClient } from '@azure/openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService {
  private openaiClient: OpenAIClient;

  constructor(private configService: ConfigService) {
    this.openaiClient = new OpenAIClient(
      this.configService.get<string>('AZURE_OPENAI_ENDPOINT'),
      new AzureKeyCredential(
        this.configService.get<string>('AZURE_OPENAI_KEY'),
      ),
    );
  }

  async getChatCompletion(
    prompt: string,
    maxTokens: number = 1000,
  ): Promise<string> {
    try {
      const response = await this.openaiClient.getChatCompletions(
        this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT_NAME'),
        [{ role: 'user', content: prompt }],
        { temperature: 0.7, maxTokens },
      );

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error in OpenAI request:', error);
      throw new Error('Failed to get chat completion from OpenAI');
    }
  }
}
