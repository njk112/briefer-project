import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DownloadFileDto } from './dtos/downloadFile.dto';
import { UploadFileDto } from './dtos/uploadFile.dto';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../configs/config.interface';
import { SupabaseException } from './exceptions/supabase.exceptions';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<SupabaseConfig>('supabase').supabaseUrl,
      this.configService.get<SupabaseConfig>('supabase').supabaseKey,
    );
  }

  private handleError(
    error: any,
    jobFunction: string,
    fileId: string,
    bucket: string,
    path: string,
  ) {
    const supabaseException = new SupabaseException(
      error.message,
      jobFunction,
      fileId,
      bucket,
      path,
    );
    this.logger.error(supabaseException);
    throw error;
  }

  async getBucketFiles(bucket: string, folder: string) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder, { limit: 100 });
      if (error) {
        this.handleError(error, 'getBucketFiles', '', bucket, folder);
      }
      return data;
    } catch (error) {
      this.handleError(error, 'getBucketFiles', '', bucket, folder);
    }
  }

  async downloadFile(downloadFileDto: DownloadFileDto) {
    try {
      const { data, error } = await this.supabase.storage
        .from(downloadFileDto.bucket)
        .download(`${downloadFileDto.path}/${downloadFileDto.fileName}`);
      if (error) {
        this.handleError(
          error,
          'downloadFile',
          downloadFileDto.fileName,
          downloadFileDto.bucket,
          downloadFileDto.path,
        );
      }
      return data;
    } catch (error) {
      this.handleError(
        error,
        'downloadFile',
        downloadFileDto.fileName,
        downloadFileDto.bucket,
        downloadFileDto.path,
      );
    }
  }

  async uploadFile(uploadFileDto: UploadFileDto) {
    try {
      const { data, error } = await this.supabase.storage
        .from(uploadFileDto.bucket)
        .upload(uploadFileDto.path, uploadFileDto.file);
      if (error) {
        this.handleError(
          error,
          'uploadFile',
          undefined,
          uploadFileDto.bucket,
          uploadFileDto.path,
        );
      }
      return data;
    } catch (error) {
      this.handleError(
        error,
        'uploadFile',
        undefined,
        uploadFileDto.bucket,
        uploadFileDto.path,
      );
      throw error;
    }
  }
}
