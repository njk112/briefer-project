import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../exceptions/prisma.exceptions';

@Injectable()
export class BrieferPdfReportService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(BrieferPdfReportService.name);
  private handleError(error: any, data: any, entity: string, action: string) {
    const prismaException = new PrismaException(
      JSON.stringify(data),
      error.message,
      entity,
      action,
    );

    this.logger.error(prismaException);
    throw prismaException;
  }

  async createBrieferPdfReport(data: Prisma.BrieferPdfReportCreateInput) {
    try {
      return this.prisma.brieferPdfReport.create({
        data,
      });
    } catch (error) {
      this.handleError(error, data, 'brieferPdfReport', 'create');
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
      this.handleError(
        error,
        brieferPdfReportWhereUniqueInput,
        'brieferPdfReport',
        'get',
      );
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
      this.handleError(error, where, 'brieferPdfReport', 'update');
    }
  }
}
