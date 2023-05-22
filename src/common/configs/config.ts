import type { Config } from './config.interface';

const config: Config = {
  nest: {
    port: 3000,
  },
  cors: {
    enabled: true,
  },
  database: {
    databaseUrl: process.env.DATABASE_URL,
  },
  supabase: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
  },
  redis: {
    redisUrl: process.env.REDIS_URL,
  },
  storage: {
    bucket: process.env.YOUTUBE_BUCKET,
    pdfPath: 'summaries',
    audioPath: 'audio',
    audioFormat: '.mp4',
    textPath: 'text',
    textFormat: '.txt',
  },
  openAi: {
    apiKey: process.env.OPEN_AI_API_KEY,
    chatModel: 'gpt-3.5-turbo',
    chatEndpoint: 'https://api.openai.com/v1/chat/completions',
    whisperModel: 'whisper-1',
    whisperEndpoint: 'https://api.openai.com/v1/audio/transcriptions',
    whisperLanguage: 'en',
    tokenLimit: 4096,
    whisperFinalPrompt:
      'Write me a summary of these text parts. Fit in 4 sentences.',
  },
  mailJet: {
    apiKey: process.env.MAILJET_API_KEY,
    apiSecret: process.env.MAILJET_SECRET_KEY,
    fromEmail: 'naglis98@outlook.com',
    fromName: 'Briefer',
    subject: 'Briefer: Here is your summary!',
    text: 'Hi, here is your summary!',
    contentType: 'application/pdf',
  },
  auth: {
    authKey: process.env.AUTH_KEY,
  },
};

export default (): Config => config;
