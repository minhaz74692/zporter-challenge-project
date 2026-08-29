import { NodeEnv } from './env.validation.js';

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  isProduction: boolean;
}

export interface FirebaseConfig {
  projectId: string;
  credentialsPath?: string;
  serviceAccountKey?: string;
}

export interface Configuration {
  app: AppConfig;
  firebase: FirebaseConfig;
}

/**
 * Maps the flat, validated env into a typed nested tree. Consumers read
 * `configService.get('firebase', { infer: true })` and get a `FirebaseConfig`,
 * never a raw `process.env` string.
 */
export function configuration(): Configuration {
  const nodeEnv = (process.env.NODE_ENV as NodeEnv) ?? NodeEnv.Development;

  return {
    app: {
      nodeEnv,
      port: parseInt(process.env.PORT ?? '3000', 10),
      isProduction: nodeEnv === NodeEnv.Production,
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID as string,
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    },
  };
}
