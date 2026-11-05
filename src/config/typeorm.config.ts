import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

const getDatabaseSsl = (config: ConfigService) => {
  const sslEnabled = config.get<string>('DATABASE_SSL_ENABLED') === 'true';

  if (!sslEnabled) {
    return false;
  }

  return {
    rejectUnauthorized:
      config.get<string>('DATABASE_REJECT_UNAUTHORIZED') !== 'false',

    ...(config.get<string>('DATABASE_CA') && {
      ca: config.get<string>('DATABASE_CA')!.replace(/\\n/g, '\n'),
    }),

    ...(config.get<string>('DATABASE_KEY') && {
      key: config.get<string>('DATABASE_KEY')!.replace(/\\n/g, '\n'),
    }),

    ...(config.get<string>('DATABASE_CERT') && {
      cert: config.get<string>('DATABASE_CERT')!.replace(/\\n/g, '\n'),
    }),
  };
};

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],

  useFactory: async (config: ConfigService): Promise<TypeOrmModuleOptions> => {
    return {
      type: 'postgres',

      host: config.get<string>('DATABASE_HOST'),
      port: config.get<number>('DATABASE_PORT', 5432),
      database: config.get<string>('DATABASE_NAME'),
      username: config.get<string>('DATABASE_USERNAME'),
      password: config.get<string>('DATABASE_PASSWORD'),

      ssl: getDatabaseSsl(config),

      entities: [__dirname + '/../**/*.entity.{js,ts}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],

      synchronize: config.get<string>('DATABASE_SYNCHRONIZE') === 'true',

      logging: false,
      schema: 'public',

      extra: {
        max: config.get<number>('DATABASE_MAX_CONNECTIONS', 10),
      },
    };
  },
};

// Used by TypeORM CLI migrations
export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',

  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,

  ssl:
    process.env.DATABASE_SSL_ENABLED === 'true'
      ? {
          rejectUnauthorized:
            process.env.DATABASE_REJECT_UNAUTHORIZED !== 'false',

          ...(process.env.DATABASE_CA && {
            ca: process.env.DATABASE_CA.replace(/\\n/g, '\n'),
          }),

          ...(process.env.DATABASE_KEY && {
            key: process.env.DATABASE_KEY.replace(/\\n/g, '\n'),
          }),

          ...(process.env.DATABASE_CERT && {
            cert: process.env.DATABASE_CERT.replace(/\\n/g, '\n'),
          }),
        }
      : false,

  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],

  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  logging: false,
  schema: 'public',
};
