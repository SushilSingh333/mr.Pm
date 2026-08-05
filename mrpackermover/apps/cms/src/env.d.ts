declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    PAYLOAD_SECRET: string;
    NODE_ENV: 'development' | 'production' | 'test';
    BUILD_WEBHOOK_URL?: string;
    BUILD_TRIGGER_TOKEN?: string;
  }
}
