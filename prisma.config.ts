import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const schema = process.env.PRISMA_SCHEMA_PATH || 'prisma/schema.prisma';

export default defineConfig({
  schema,
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
});
