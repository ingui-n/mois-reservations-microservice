import {drizzle} from "drizzle-orm/node-postgres";

export const db = drizzle(
  `postgress://${Bun.env.RESERVATIONS_DATABASE_USER!}:${Bun.env.RESERVATIONS_DATABASE_PASSWORD!}@${Bun.env.DATABASE_IP}:5432/${Bun.env.RESERVATIONS_DATABASE_DB}`
);
