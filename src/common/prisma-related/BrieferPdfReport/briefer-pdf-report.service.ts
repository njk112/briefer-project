import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../exceptions/prisma.exceptions';

@Injectable()
export class BrieferPdfReportService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(BrieferPdfReportService.name);

  async createBrieferPdfReport(data: Prisma.BrieferPdfReportCreateInput) {
    try {
      return this.prisma.brieferPdfReport.create({
        data,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(data),
        error.message,
        'brieferPdfReport',
        'create',
      );

      this.logger.error(prismaException);
      throw prismaException;
    }
  }

  async getBrieferPdfReport(
    brieferPdfReportWhereUniqueInput: Prisma.BrieferPdfReportWhereUniqueInput,
  ) {
    try {
      return this.prisma.brieferPdfReport.findUnique({
        where: brieferPdfReportWhereUniqueInput,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(brieferPdfReportWhereUniqueInput),
        error.message,
        'brieferPdfReport',
        'get',
      );
      this.logger.error(prismaException);
      throw prismaException;
    }
  }

  async updateBrieferPdfReport(
    where: Prisma.BrieferPdfReportWhereUniqueInput,
    data: Prisma.BrieferPdfReportUpdateInput,
  ) {
    try {
      return this.prisma.brieferPdfReport.update({
        data,
        where,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(where),
        error.message,
        'brieferPdfReport',
        'update',
      );
      this.logger.error(prismaException);
      throw prismaException;
    }
  }
}
