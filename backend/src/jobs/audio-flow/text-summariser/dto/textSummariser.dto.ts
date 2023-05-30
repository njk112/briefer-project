import { IsString, IsNotEmpty } from 'class-validator';

export class TextSummariserDto {
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
