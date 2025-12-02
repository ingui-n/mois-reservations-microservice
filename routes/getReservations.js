import {and, eq, gte, isNull, lte, or} from "drizzle-orm";
import {reservationsTable} from "../db/schema.js";
import {db} from "../db/database.js";
import {getReservationsSchema} from "../lib/validationSchemas.js";
import {getComputerUnwrapped} from "../lib/apiCalls.js";
import {getAuthHeaders} from "../lib/authHeaders.js";
import {z} from "zod";

export const getReservations = async req => {
  try {
    const url = new URL(req.url);
    const headers = getAuthHeaders(req.headers);

    const unsafeUserId = url.searchParams.get('userId');
    const unsafeComputerId = Number(url.searchParams.get('computerId'));
    const unsafeFrom = url.searchParams.get('from');
    const unsafeTo = url.searchParams.get('to');

    const {userId, computerId, from, to} = await getReservationsSchema.parse({
      userId: unsafeUserId,
      computerId: unsafeComputerId,
      from: unsafeFrom,
      to: unsafeTo
    });

    // reject if the request is not from the same user and user is not admin
    if (userId && headers.userId !== userId && !headers.userRoles.includes(Bun.env.ROLE_ADMIN)) {
      return Response.json('Forbidden', {status: 403});
    }

    const reservations = await getReservationsFromDatabase(headers, userId, computerId, from, to);

    return Response.json(reservations, {status: 200});
  } catch (err) {
    console.error(err);

    if (err instanceof z.ZodError) {
      return Response.json(err.issues[0].message || 'Bad request', {status: 400});
    }

    return new Response(err.message, {status: 500});
  }
};

const getReservationsFromDatabase = async (headers, userId, computerId, from, to) => {
  const reservations = await db.select()
    .from(reservationsTable)
    .where(
      and(
        userId && eq(reservationsTable.userId, userId),
        computerId && eq(reservationsTable.computerId, computerId),

        (from || to) ? or(
          // Overlaps with 'from' (active at 'from' time)
          from && and(
            lte(reservationsTable.startDateTime, from),
            gte(reservationsTable.endDateTime, from)
          ),
          // Overlaps with 'to' (active at 'to' time)
          to && and(
            lte(reservationsTable.startDateTime, to),
            gte(reservationsTable.endDateTime, to)
          ),
          // Completely within [from, to]
          from && to && and(
            gte(reservationsTable.startDateTime, from),
            lte(reservationsTable.endDateTime, to)
          )
        ) : undefined,

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
