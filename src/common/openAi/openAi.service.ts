import { Injectable } from '@nestjs/common';
import { WhisperResponseDto } from './dtos/whisper.dto';
import { encodeGenerator } from 'gpt-tokenizer';
import { ChatResponseDto, MessageDto } from './dtos/chat.dto';

@Injectable()
export class OpenAiService {
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
      const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
        }),
      });
      const summaryData: ChatResponseDto = await res.json();
      return summaryData.choices[0].message.content;
    } catch (error) {
      throw error;
    }
  }

  createWhisperFormData(file: Blob, fileName: string) {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    return formData;
  }

  async whisperAudioToText(
    blob: Blob,
    fileName: string,
  ): Promise<WhisperResponseDto> {
    const formData = this.createWhisperFormData(blob, fileName);
    try {
      const res = await fetch(
        `https://api.openai.com/v1/audio/transcriptions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
            Accept: 'application/json',
          },
          body: formData,
        },
      );
      const textData: WhisperResponseDto = await res.json();
      return textData;
    } catch (error) {
      throw error;
    }
  }
}
