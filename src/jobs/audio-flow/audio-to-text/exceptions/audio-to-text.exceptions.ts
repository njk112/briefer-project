export class AudioToTextException extends Error {
  constructor(errorMessage: string) {
    super(`AUDIO_TO_TEXT_WORKER ERROR: ${errorMessage}`);
    Object.setPrototypeOf(this, AudioToTextException.prototype);
  }
}
