import {drizzle} from "drizzle-orm/node-postgres";

export const db = drizzle(
  `postgress://${Bun.env.RESERVATIONS_DATABASE_USER!}:${Bun.env.RESERVATIONS_DATABASE_PASSWORD!}@${Bun.env.RESERVATIONS_DATABASE_URL}/${Bun.env.RESERVATIONS_DATABASE_DB}`
);
