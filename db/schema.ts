import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

export const reservationsTable = pgTable("reservations", {
  id: uuid().primaryKey().unique(),
  createdAt: timestamp('createdAt', {withTimezone: true}).notNull(),
  deletedAt: timestamp('deletedAt', {withTimezone: true}),
  userId: uuid().notNull(),
  computerId: uuid().notNull(),
  password: text().notNull(),
  startDateTime: timestamp('startDateTime', {withTimezone: true}).notNull(),
  endDateTime: timestamp('endDateTime', {withTimezone: true}).notNull(),
});
