import {and, eq, gte, isNull, lte, or} from "drizzle-orm";
import {reservationsTable} from "../db/schema.js";
import {db} from "../db/database.js";
import {getReservationsByDatesSchema, getReservationsSchema, uuidSchema} from "../lib/validationSchemas.js";
import {getComputerUnwrapped} from "../lib/apiCalls.js";
import {getAuthHeaders} from "../lib/authHeaders.js";
import {z} from "zod";
import moment from "moment-timezone";

export const getReservations = async req => {
  try {
    const url = new URL(req.url);
    const headers = getAuthHeaders(req.headers);

    /** GET by userId (uuid) */

    const unsafeUserId = url.searchParams.get('userId');

    /** GET by computerId (uuid), from (dateTime) and to (dateTime) */

    const unsafeComputerId = Number(url.searchParams.get('computerId'));
    const unsafeFrom = url.searchParams.get('from');
    const unsafeTo = url.searchParams.get('to');

    /** for /reservations?userId="uuid" */

    if (unsafeUserId) {
      const userId = await uuidSchema.parse(unsafeUserId);

      if (headers.userId !== userId) {
        return Response.json('Forbidden', {status: 403});
      }

      const reservations = await byUserId(headers, userId);
      return Response.json(reservations, {status: 200});
    }

    /** for /reservations?computerId="uuid"&from="dateTime"&to="dateTime" */

    if (unsafeComputerId && unsafeFrom && unsafeTo) {
      const {computerId, from, to} = await getReservationsSchema.parse({
        computerId: unsafeComputerId,
        from: unsafeFrom,
        to: unsafeTo
      });

      const reservations = await reservationsByComputerId(headers, computerId, from, to);
      return Response.json(reservations, {status: 200});
    }

    /** for /reservations?from="dateTime"&to="dateTime" */

    if (unsafeFrom && unsafeTo) {
      const {from, to} = await getReservationsByDatesSchema.parse({
        from: unsafeFrom,
        to: unsafeTo
      });

      const reservations = await reservationsByDates(headers, from, to);
      return Response.json(reservations, {status: 200});
    }

    return Response.json('Bad request', {status: 400});
  } catch (err) {
    console.error(err);

    if (err instanceof z.ZodError) {
      return Response.json(err.issues[0].message || 'Bad request', {status: 400});
    }

    return new Response(err.message, {status: 500});
  }
};

const byUserId = async (headers, userId) => {
  const reservations = await db.select()
    .from(reservationsTable)
    .where(
      and(
        eq(reservationsTable.userId, userId),
        gte(reservationsTable.endDateTime, moment()), // only the current or the future ones
        isNull(reservationsTable.deletedAt)
      )
    );

  return await formatReservations(headers, reservations);
};

const reservationsByComputerId = async (headers, computerId, from, to) => {
  const reservations = await db.select()
    .from(reservationsTable)
    .where(
      and(
        eq(reservationsTable.computerId, computerId),
        or(
          and(lte(reservationsTable.startDateTime, from), gte(reservationsTable.endDateTime, from)),
          and(lte(reservationsTable.startDateTime, to), gte(reservationsTable.endDateTime, to)),
          and(lte(reservationsTable.endDateTime, to), gte(reservationsTable.startDateTime, from))
        ),
        isNull(reservationsTable.deletedAt)
      )
    );

  return await formatReservations(headers, reservations);
};

const reservationsByDates = async (headers, from, to) => {
  const reservations = await db.select()
    .from(reservationsTable)
    .where(
      and(
        or(
          and(lte(reservationsTable.startDateTime, from), gte(reservationsTable.endDateTime, from)),
          and(lte(reservationsTable.startDateTime, to), gte(reservationsTable.endDateTime, to)),
          and(lte(reservationsTable.endDateTime, to), gte(reservationsTable.startDateTime, from))
        ),
        isNull(reservationsTable.deletedAt)
      )
    );

  return await formatReservations(headers, reservations);
};

const formatReservations = async (headers, reservations) => {
  for (const reservation of reservations) {
    reservation.computer = await getComputerUnwrapped(reservation.computerId);
    delete reservation.computerId;

    if (!headers.userRoles.includes(Bun.env.ROLE_ADMIN) && reservation.userId !== headers.userId) {
      delete reservation.password;
      delete reservation.deletedAt;
    }
  }

  return reservations;
};
