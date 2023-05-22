export class PdfGeneratorException extends Error {
  constructor(errorMessage: string) {
    super(`PDF_GENERATOR_WORKER ERROR: ${errorMessage}`);
    Object.setPrototypeOf(this, PdfGeneratorException.prototype);
  }
}
