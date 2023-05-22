export class TextSummariserException extends Error {
  constructor(errorMessage: string) {
    super(`TEXT_SUMMARISER_WORKER ERROR: ${errorMessage}`);
    Object.setPrototypeOf(this, TextSummariserException.prototype);
  }
}
