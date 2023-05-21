import { IsString, IsArray, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class QueueJobDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  urls: string[];
}

export class TranscribeJobDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  fileId: string;
}

export class SummaryJobDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  fileId: string;
}
