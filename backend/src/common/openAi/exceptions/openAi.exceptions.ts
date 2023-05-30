export class OpenAiException extends Error {
  constructor(errorMessage: string, fileName?: string) {
    super(`OPENAI_ERROR: ${errorMessage}, fileName: ${fileName}`);
    Object.setPrototypeOf(this, OpenAiException.prototype);
  }
}
