import { IsString } from 'class-validator';

export class WhisperResponseDto {
  @IsString()
  text: string;
}
