import {and, between, eq} from "drizzle-orm";
import {reservationsTable} from "../db/schema.js";
import {db} from "../db/database.js";
import {getReservationsSchema, uuidSchema} from "../validationSchemas.js";
import {getComputerUnwrapped} from "../apiCalls.js";
import {getAuthHeaders} from "../authHeaders.js";

export const getReservations = async req => {
  try {
    const url = new URL(req.url);

    /** GET by userId (uuid) */

    const unsafeUserId = url.searchParams.get('userId');

    /** GET by computerId (uuid), from (dateTime) and to (dateTime) */

    const unsafeComputerId = url.searchParams.get('computerId');
    const unsafeFrom = url.searchParams.get('from');
    const unsafeTo = url.searchParams.get('to');

    /** for /reservations?computerId="uuid"&from="dateTime"&to="dateTime" */

    const validation = await getReservationsSchema.safeParseAsync({
      computerId: unsafeComputerId,
      from: unsafeFrom,
      to: unsafeTo
    });

    if (validation.success) {
      const reservations = await db.select()
        .from(reservationsTable)
        .where(
          and(
            eq(reservationsTable.computerId, validation.data.computerId),
            between(reservationsTable.startDateTime, new Date(validation.data.from), new Date(validation.data.to))
          )
        );

      for (const reservation of reservations) {
        reservation.computer = await getComputerUnwrapped(reservation.id);
        delete reservation.computerId;
      }

      return Response.json(reservations, {status: 200});
    }

    /** for /reservations?userId="uuid" */

    const validationUserId = uuidSchema.safeParse(unsafeUserId);

    if (validationUserId.success) {
      const {userId} = getAuthHeaders(req.headers);

      if (userId !== validationUserId.data) {
        return Response.json('Forbidden', {status: 403});
      }

      const reservations = await db.select()
        .from(reservationsTable)
        .where(
          eq(reservationsTable.userId, validationUserId.data)
        );

      for (const reservation of reservations) {
        reservation.computer = await getComputerUnwrapped(reservation.id);
        delete reservation.computerId;
      }

      return Response.json(reservations, {status: 200});
    }

    return Response.json('Bad request', {status: 400});
  } catch (e) {
    console.error(e);

    return new Response(e.message, {status: 500});
  }
};
