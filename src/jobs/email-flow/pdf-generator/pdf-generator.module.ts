import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { PdfGeneratorProcessor } from './pdf-generator.processor';
import { PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pdf-generator',
    }),
    SupabaseModule,
    PrismaModule,
  ],
  providers: [PdfGeneratorProcessor],
  exports: [BullModule],
})
export class PdfGeneratorModule {}
