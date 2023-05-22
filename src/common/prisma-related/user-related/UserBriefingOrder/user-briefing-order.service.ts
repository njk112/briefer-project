import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class UserBriefingOrderService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(UserBriefingOrderService.name);

  async createUserBriefingOrder(data: Prisma.UserBriefingOrderCreateInput) {
    try {
      return this.prisma.userBriefingOrder.create({
        data,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(data),
        error.message,
        'userBriefingOrder',
        'create',
      );

      this.logger.error(prismaException);
      throw prismaException;
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
      const prismaException = new PrismaException(
        JSON.stringify(userBriefingOrderWhereUniqueInput),
        error.message,
        'userBriefingOrder',
        'get',
      );
      this.logger.error(prismaException);
      throw prismaException;
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
      const prismaException = new PrismaException(
        JSON.stringify(userBriefingOrderWhereUniqueInput),
        error.message,
        'userBriefingOrder',
        'update',
      );
      this.logger.error(prismaException);
      throw prismaException;
    }
  }
}
