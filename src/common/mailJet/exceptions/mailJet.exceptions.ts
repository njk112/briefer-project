export class MailJetException extends Error {
  constructor(errorMessage: string) {
    super(`MAILJET_ERROR: ${errorMessage}`);
    Object.setPrototypeOf(this, MailJetException.prototype);
  }
}
