import { IsString, IsArray, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class QueueJobDto {
  @IsString()
  @IsNotEmpty()
  userEmail: string;

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

export class GeneratePdfDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  fileIds: string[];
}

export class SendEmailDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  fileId: string;
}
