import { IsString, IsNotEmpty } from 'class-validator';

export class AudioDownloaderDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  briefingOrderId: string;
}
