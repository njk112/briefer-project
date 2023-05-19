import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { SupabaseService } from 'src/common/supabase/supabase.service';
@Processor('audio-to-text')
export class AudioToTextProcessor {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
  ) {}
  private readonly logger = new Logger(AudioToTextProcessor.name);

  @Process('transcribe')
  async handleAudioToText(job: Job) {
    return;
  }
}
