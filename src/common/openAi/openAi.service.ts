import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class OpenAiService {
  private openAi: OpenAIApi;
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openAi = new OpenAIApi(configuration);
  }

  async gpt4TextToSummary() {
    return;
  }

  async whisperAudioToText(audioFile: File) {
    try {
      const transcript = await this.openAi.createTranscription(
        audioFile,
        'whisper-1',
      );
      return transcript?.data?.text;
    } catch (error) {
      throw {
        OPEN_AI_WHISPER_ERROR: {
          error,
        },
      };
    }
  }
}
