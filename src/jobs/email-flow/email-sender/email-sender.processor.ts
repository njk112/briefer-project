import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { SupabaseService } from 'src/common/supabase/supabase.service';
@Processor('email-sender')
export class EmailSenderProcessor {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
  ) {}
  private readonly logger = new Logger(EmailSenderProcessor.name);

  @Process('sendEmail')
  async sendEmail(job: Job) {
    return;
  }
}
