import 'dotenv/config';
import {defineConfig} from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgress://${process.env.RESERVATIONS_DATABASE_USER!}:${process.env.RESERVATIONS_DATABASE_PASSWORD!}@${process.env.DATABASE_IP}:5432/${process.env.RESERVATIONS_DATABASE_DB}`
  },
});
