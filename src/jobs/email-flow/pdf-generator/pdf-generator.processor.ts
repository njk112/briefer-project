import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { SupabaseService } from 'src/common/supabase/supabase.service';
@Processor('pdf-generator')
export class PdfGeneratorProcessor {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
  ) {}
  private readonly logger = new Logger(PdfGeneratorProcessor.name);

  @Process('generatePdf')
  async generatePdf(job: Job) {
    return;
  }
}
