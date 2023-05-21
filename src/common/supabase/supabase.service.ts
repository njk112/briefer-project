import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DownloadFileDto } from './dtos/downloadFile.dto';
import { UploadFileDto } from './dtos/uploadFile.dto';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../configs/config.interface';

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

  async getBucketFiles(bucket: string, folder: string) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder, { limit: 100 });
      if (error) {
        this.logger.error(
          `SUPABASE_SERVICE: Error getting bucket files: bucket: ${bucket}, folder: ${folder}, error: ${error.message}`,
        );
        throw error;
      }
      return data;
    } catch (error) {
      this.logger.error(
        `SUPABASE_SERVICE: Error getting bucket files: bucket: ${bucket}, folder: ${folder}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async downloadFile(downloadFileDto: DownloadFileDto) {
    try {
      const { data, error } = await this.supabase.storage
        .from(downloadFileDto.bucket)
        .download(`${downloadFileDto.path}/${downloadFileDto.fileName}`);
      if (error) {
        this.logger.error(
          `SUPABASE_SERVICE: Failed to download file: bucket: ${downloadFileDto.bucket}, path: ${downloadFileDto.path}, fileName: ${downloadFileDto.fileName}, error: ${error.message}`,
        );
        throw error;
      }
      return data;
    } catch (error) {
      this.logger.error(
        `SUPABASE_SERVICE: Error downloading file: bucket: ${downloadFileDto.bucket}, path: ${downloadFileDto.path}, fileName: ${downloadFileDto.fileName}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async uploadFile(uploadFileDto: UploadFileDto) {
    try {
      const { data, error } = await this.supabase.storage
        .from(uploadFileDto.bucket)
        .upload(uploadFileDto.path, uploadFileDto.file);
      if (error) {
        this.logger.error(
          `SUPABASE_SERVICE: Failed to upload file: bucket: ${uploadFileDto.bucket}, path: ${uploadFileDto.path}, error: ${error.message}`,
        );
        throw error;
      }
      return data;
    } catch (error) {
      this.logger.error(
        `SUPABASE_SERVICE: Error uploading file: bucket: ${uploadFileDto.bucket}, path: ${uploadFileDto.path}, error: ${error.message}`,
      );
      throw error;
    }
  }
}
