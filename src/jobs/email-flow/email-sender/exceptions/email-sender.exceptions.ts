export class EmailSenderException extends Error {
  constructor(errorMessage: string) {
    super(`EMAIL_SENDER_WORKER ERROR: ${errorMessage}`);
    Object.setPrototypeOf(this, EmailSenderException.prototype);
  }
}
