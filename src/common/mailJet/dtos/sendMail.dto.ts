import { IsString, IsNotEmpty, IsMimeType } from 'class-validator';

export class SendEmailDto {
  @IsNotEmpty()
  @IsString()
  to: string;

  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsString()
  fromName: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  buffer: Buffer;

  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsNotEmpty()
  @IsMimeType()
  contentType: string;
}
