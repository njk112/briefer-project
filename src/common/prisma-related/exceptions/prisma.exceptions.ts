export class PrismaException extends Error {
  constructor(
    data: string,
    errorMessage: string,
    serviceName: string,
    jobFunction: string,
  ) {
    super(
      `PRISMA ERROR: Failed to ${jobFunction} ${serviceName}: ${data}, error: ${errorMessage}`,
    );
    Object.setPrototypeOf(this, PrismaException.prototype);
  }
}
