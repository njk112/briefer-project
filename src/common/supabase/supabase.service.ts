import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

  async uploadFile(bucket: string, path: string, file: any) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file);
      return { data, error };
    } catch (error) {
      console.log({ error });
    }
  }
}
