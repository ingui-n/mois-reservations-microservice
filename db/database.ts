import {drizzle} from "drizzle-orm/node-postgres";

export const db = drizzle(Bun.env.DATABSE_URL);
