import {pgTable, text, timestamp, uuid, integer} from "drizzle-orm/pg-core";

export const reservationsTable = pgTable("reservations", {
  id: uuid().primaryKey().unique().defaultRandom(),
  createdAt: timestamp('createdAt', {withTimezone: true}).notNull().defaultNow(),
  deletedAt: timestamp('deletedAt', {withTimezone: true}).default(null),
  userId: uuid().notNull(),
  computerId: integer().notNull(),
  password: text().notNull(),
  startDateTime: timestamp('startDateTime', {withTimezone: true}).notNull(),
  endDateTime: timestamp('endDateTime', {withTimezone: true}).notNull(),
});
