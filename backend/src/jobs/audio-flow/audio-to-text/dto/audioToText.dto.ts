import { IsString, IsNotEmpty } from 'class-validator';

export class AudioToTextDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  briefingOrderId: string;

  @IsString()
  @IsNotEmpty()
  fileId: string;
}
