import {and, eq, gte, isNull, lte, or} from "drizzle-orm";
import {reservationsTable} from "../db/schema.js";
import {db} from "../db/database.js";
import {getReservationsSchema} from "../lib/validationSchemas.js";
import {getComputerUnwrapped} from "../lib/apiCalls.js";
import {getAuthHeaders} from "../lib/authHeaders.js";
import {z} from "zod";

/**
 * funkce pro získání rezervací podle search params
 * @param req
 * @returns {Promise<Response>}
 */
export const getReservations = async req => {
  try {
    const url = new URL(req.url);
    /** headers z API gateway jwt payload */
    const headers = getAuthHeaders(req.headers);

    const unsafeUserId = url.searchParams.get('userId');
    const unsafeComputerId = Number(url.searchParams.get('computerId'));
    const unsafeFrom = url.searchParams.get('from');
    const unsafeTo = url.searchParams.get('to');

    /** validace vstupů z params */
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

/**
 * získání rezervací z databáze pomocí drizzle
 * @param headers
 * @param userId
 * @param computerId
 * @param from
 * @param to
 * @returns {Promise<*>}
 */
const getReservationsFromDatabase = async (headers, userId, computerId, from, to) => {
  const reservations = await db.select()
    .from(reservationsTable)
    .where(
      and(
        userId && eq(reservationsTable.userId, userId),
        computerId && eq(reservationsTable.computerId, computerId),

        and(
          from ? gte(reservationsTable.endDateTime, from) : undefined,
          to ? lte(reservationsTable.startDateTime, to) : undefined
        ),

        isNull(reservationsTable.deletedAt)
      )
    );

  return await formatReservations(headers, reservations);
};

/**
 * formátování výstupu rezrvací z databáze
 * přidání unwrapped computer
 * @param headers
 * @param reservations
 * @returns {Promise<*>}
 */
const formatReservations = async (headers, reservations) => {
  for (const reservation of reservations) {
    reservation.computer = await getComputerUnwrapped(reservation.computerId);
    delete reservation.computerId;

    /** pokud není uživatel admin a zároveň není vlastníkem rezervace -> odstranení polí */
    if (!headers.userRoles.includes(Bun.env.ROLE_ADMIN) && reservation.userId !== headers.userId) {
      delete reservation.password;
      delete reservation.deletedAt;
    }
  }

  return reservations;
};
