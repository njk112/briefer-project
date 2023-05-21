import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DownloadFileDto } from './dtos/downloadFile.dto';
import { UploadFileDto } from './dtos/uploadFile.dto';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../configs/config.interface';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<SupabaseConfig>('supabase').supabaseUrl,
      this.configService.get<SupabaseConfig>('supabase').supabaseKey,
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async getBucketFiles(bucket: string, folder: string) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder, { limit: 100 });
      return { data, error };
    } catch (error) {
      throw { SUPABASE_GET_BUCKET_FILES_ERROR: { error } };
    }
  }

  async downloadFile(downloadFileDto: DownloadFileDto) {
    try {
      const { data, error } = await this.supabase.storage
        .from(downloadFileDto.bucket)
        .download(`${downloadFileDto.path}/${downloadFileDto.fileName}`);
      return { data, error };
    } catch (error) {
      throw { SUPABASE_DOWNLOAD_ERROR: { error } };
    }
  }

  async uploadFile(uploadFileDto: UploadFileDto) {
    try {
      const { data, error } = await this.supabase.storage
        .from(uploadFileDto.bucket)
        .upload(uploadFileDto.path, uploadFileDto.file);
      return { data, error };
    } catch (error) {
      throw { SUPABASE_UPLOAD_ERROR: { error } };
    }
  }
}
