import { IsString, IsNotEmpty } from 'class-validator';

export class PdfGeneratorDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  briefingOrderId: string;
}
