import { Injectable, Logger } from '@nestjs/common';
import { WhisperResponseDto } from './dtos/whisper.dto';
import { encodeGenerator } from 'gpt-tokenizer';
import { ChatResponseDto, MessageDto } from './dtos/chat.dto';
import { ConfigService } from '@nestjs/config';
import { OpenAiConfig } from '../configs/config.interface';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private openApiKey: string;
  private whisperEndpoint: string;
  private whisperModel: string;
  private whisperLanguage: string;
  private chatEndpoint: string;
  private chatModel: string;
  constructor(private configService: ConfigService) {
    this.openApiKey = this.configService.get<OpenAiConfig>('openAi').apiKey;
    this.whisperEndpoint =
      this.configService.get<OpenAiConfig>('openAi').whisperEndpoint;
    this.whisperModel =
      this.configService.get<OpenAiConfig>('openAi').whisperModel;
    this.whisperLanguage =
      this.configService.get<OpenAiConfig>('openAi').whisperLanguage;
    this.chatEndpoint =
      this.configService.get<OpenAiConfig>('openAi').chatEndpoint;
    this.chatModel = this.configService.get<OpenAiConfig>('openAi').chatModel;
  }

  getTokenCount(text: string, cache = new Map()): number {
    const tokenGenerator = encodeGenerator(text, cache);
    let count = 0;
    for (const tokens of tokenGenerator) {
      count += tokens.length;
    }
    return count;
  }

  async chatGptToSummary(messages: MessageDto[]): Promise<string> {
    try {
      const res = await fetch(this.chatEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openApiKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.chatModel,
          messages,
        }),
      });
      const summaryData: ChatResponseDto = await res.json();
      return summaryData.choices[0].message.content;
    } catch (error) {
      this.logger.error(
        `OPENAI_SERVICE: Error in chatGptToSummary: messages: ${JSON.stringify(
          messages,
        )}, error: ${error.message}`,
      );
      throw error;
    }
  }

  createWhisperFormData(file: Blob, fileName: string) {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('model', this.whisperModel);
    formData.append('language', this.whisperLanguage);
    return formData;
  }

  async whisperAudioToText(
    blob: Blob,
    fileName: string,
  ): Promise<WhisperResponseDto> {
    const formData = this.createWhisperFormData(blob, fileName);
    try {
      const res = await fetch(this.whisperEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openApiKey}`,
          Accept: 'application/json',
        },
        body: formData,
      });
      const textData: WhisperResponseDto = await res.json();
      return textData;
    } catch (error) {
      this.logger.error(
        `OPENAI_SERVICE: Error in whisperAudioToText: fileName: ${fileName}, error: ${error.message}`,
      );
      throw error;
    }
  }
}
