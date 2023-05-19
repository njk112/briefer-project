import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { SupabaseService } from 'src/common/supabase/supabase.service';
@Processor('text-summariser')
export class TextSummariserProcessor {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
  ) {}
  private readonly logger = new Logger(TextSummariserProcessor.name);

  @Process('summarise')
  async handleSummarisation(job: Job) {
    return;
  }
}
