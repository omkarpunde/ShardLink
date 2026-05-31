import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'shardlink',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  slug: {
    length: parseInt(process.env.SLUG_LENGTH || '7', 10),
  },

  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  rateLimit: {
    createLink: { windowMs: 3600000, max: 100 },
    redirect: { windowMs: 60000, max: 1000 },
  },
};
