import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class UserBriefingOrderService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(UserBriefingOrderService.name);
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

  async createUserBriefingOrder(data: Prisma.UserBriefingOrderCreateInput) {
    try {
      return this.prisma.userBriefingOrder.create({
        data,
      });
    } catch (error) {
      this.handleError(error, data, 'userBriefingOrder', 'create');
    }
  }

  async getUserBriefingOrder(
    userBriefingOrderWhereUniqueInput: Prisma.UserBriefingOrderWhereUniqueInput,
    selectFieldsInput?: Prisma.UserBriefingOrderSelect,
  ) {
    try {
      return this.prisma.userBriefingOrder.findUnique({
        where: userBriefingOrderWhereUniqueInput,
        select: selectFieldsInput,
      });
    } catch (error) {
      this.handleError(
        error,
        userBriefingOrderWhereUniqueInput,
        'userBriefingOrder',
        'get',
      );
    }
  }

  async updateUserBriefingOrder(
    userBriefingOrderWhereUniqueInput: Prisma.UserBriefingOrderWhereUniqueInput,
    data: Prisma.UserBriefingOrderUpdateInput,
  ) {
    try {
      return this.prisma.userBriefingOrder.update({
        data,
        where: userBriefingOrderWhereUniqueInput,
      });
    } catch (error) {
      this.handleError(
        error,
        userBriefingOrderWhereUniqueInput,
        'userBriefingOrder',
        'update',
      );
    }
  }
}
