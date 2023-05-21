export interface Config {
  nest: NestConfig;
  cors: CorsConfig;
  database: DatabaseConfig;
  supabase: SupabaseConfig;
  redis: RedisConfig;
  storage: StorageConfig;
  openAi: OpenAiConfig;
  mailJet: MailJetConfig;
}

export interface NestConfig {
  port: number;
}

export interface CorsConfig {
  enabled: boolean;
}

export interface DatabaseConfig {
  databaseUrl: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export interface RedisConfig {
  redisUrl: string;
}

export interface StorageConfig {
  bucket: string;
  audioPath: string;
  pdfPath: string;
  audioFormat: string;
  textPath: string;
  textFormat: string;
}

export interface OpenAiConfig {
  apiKey: string;
  chatModel: string;
  chatEndpoint: string;
  whisperModel: string;
  whisperEndpoint: string;
  whisperLanguage: string;
  tokenLimit: number;
  whisperFinalPrompt: string;
}

export interface MailJetConfig {
  apiKey: string;
  apiSecret: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  text: string;
  contentType: string;
}
