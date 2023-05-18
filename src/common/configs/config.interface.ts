export interface Config {
  nest: NestConfig;
  cors: CorsConfig;
}

export interface NestConfig {
  port: number;
}

export interface CorsConfig {
  enabled: boolean;
}
