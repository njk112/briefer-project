import { Injectable } from '@nestjs/common';
import { WhisperResponseDto } from './dtos/whisper.dto';

@Injectable()
export class OpenAiService {
  async gpt4TextToSummary() {
    return;
  }

  async createWhisperFormData(file: Blob, fileName: string) {
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
    const formData = await this.createWhisperFormData(blob, fileName);
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
