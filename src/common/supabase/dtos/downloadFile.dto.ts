import { IsString } from 'class-validator';

export class DownloadFileDto {
  @IsString()
  bucket: string;

  @IsString()
  path: string;

  @IsString()
  fileName: string;
}
