import { IsString, IsArray, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class QueueJobDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  urls: string[];
}
