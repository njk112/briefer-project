import { IsString, IsNotEmpty } from 'class-validator';

export class EmailSendDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  brieferPdfReportId: string;
}
