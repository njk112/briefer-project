import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DownloadFileDto } from './dtos/downloadFile.dto';
import { UploadFileDto } from './dtos/uploadFile.dto';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
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
