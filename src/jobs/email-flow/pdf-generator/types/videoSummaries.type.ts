import { YoutubeVideo } from '@prisma/client';
export type PdfGeneratorYoutubeVideo = YoutubeVideo & {
  YoutubeVideoSummary: { summary: string };
};
