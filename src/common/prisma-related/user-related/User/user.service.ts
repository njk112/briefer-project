import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(UserService.name);

  async createUser(data: Prisma.UserCreateInput) {
    try {
      return this.prisma.user.create({
        data,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(data),
        error.message,
        'user',
        'create',
      );

      this.logger.error(prismaException);
      throw prismaException;
    }
  }

  async getUser(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    try {
      return this.prisma.user.findUnique({
        where: userWhereUniqueInput,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(userWhereUniqueInput),
        error.message,
        'user',
        'get',
      );
      this.logger.error(prismaException);
      throw prismaException;
    }
  }
}
