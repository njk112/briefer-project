import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(UserService.name);
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

  async createUser(data: Prisma.UserCreateInput) {
    try {
      return this.prisma.user.create({
        data,
      });
    } catch (error) {
      this.handleError(error, data, 'user', 'create');
    }
  }

  async getUser(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    try {
      return this.prisma.user.findUnique({
        where: userWhereUniqueInput,
      });
    } catch (error) {
      this.handleError(error, userWhereUniqueInput, 'user', 'get');
    }
  }
}
