export class SupabaseException extends Error {
  constructor(
    errorMessage: string,
    jobFunction: string,
    fileId: string,
    bucket: string,
    path: string,
  ) {
    super(
      `SUPABASE ERROR: Failed to ${jobFunction} file ${fileId} from bucket ${bucket} and path ${path}: ${errorMessage}`,
    );
    Object.setPrototypeOf(this, SupabaseException.prototype);
  }
}
