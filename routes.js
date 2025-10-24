import 'dotenv/config';
import {drizzle} from 'drizzle-orm/node-postgres';
import {reservationsTable} from "./db/schema.js";
import {and, between, eq} from "drizzle-orm";

export const db = drizzle(Bun.env.DATABSE_URL);

export const getReservations = async req => {
  try {
    const url = new URL(req.url);

    const userId = url.searchParams.get('userId');
    const from = url.searchParams.get('from');
    const computerId = url.searchParams.get('computerId');
    const to = url.searchParams.get('to');

    if (computerId && from && new Date(from) && to && new Date(to) && new Date(to).getTime() > new Date(from).getTime()) {
      const reservations = await db.select()
        .from(reservationsTable)
        .where(
          and(
            eq(reservationsTable.computerId, computerId),
            between(reservationsTable.startDateTime, new Date(from), new Date(to))
          )
        );

      //todo get computer by computerId, computerRoom by computerRoomId, computerConfig by configId

      return Response.json(reservations, {status: 200});
    }

    if (userId) {
      const reservations = await db.select()
        .from(reservationsTable)
        .where(
          eq(reservationsTable.userId, userId)
        );

      return Response.json(reservations, {status: 200});
    }
  } catch (e) {
    console.error(e);

    return new Response(e.message, {status: 500});
  }
};

export const getReservation = async req => {

};

export const createReservation = async req => {

};

export const deleteReservation = async req => {

};
