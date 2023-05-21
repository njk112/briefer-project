import { IsString, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
  @IsString()
  role: string;

  @IsString()
  content: string;
}

class ChoiceDto {
  @IsInt()
  index: number;

  @ValidateNested()
  @Type(() => MessageDto)
  message: MessageDto;

  @IsString()
  finish_reason: string;
}

class UsageDto {
  @IsInt()
  prompt_tokens: number;

  @IsInt()
  completion_tokens: number;

  @IsInt()
  total_tokens: number;
}

export class ChatResponseDto {
  @IsString()
  id: string;

  @IsString()
  object: string;

  @IsInt()
  created: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChoiceDto)
  choices: ChoiceDto[];

  @ValidateNested()
  @Type(() => UsageDto)
  usage: UsageDto;
}
