export class AudioDownloaderException extends Error {
  constructor(errorMessage: string) {
    super(`AUDIO_DOWNLOADER_WORKER ERROR: ${errorMessage}`);
    Object.setPrototypeOf(this, AudioDownloaderException.prototype);
  }
}
