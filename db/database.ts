import {drizzle} from "drizzle-orm/node-postgres";

export const db = drizzle(
  `postgress://${Bun.env.RESERVATIONS_DATABASE_USER!}:${Bun.env.RESERVATIONS_DATABASE_PASSWORD!}@mois-microservice-reservations-db:5432/${Bun.env.RESERVATIONS_DATABASE_DB}`
);
