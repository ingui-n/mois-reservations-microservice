import {and, between, eq} from "drizzle-orm";
import {reservationsTable} from "../db/schema.js";
import {db} from "../db/database.js";
import {getReservationsSchema, uuidSchema} from "../validationSchemas.js";
import {getComputerUnwrapped} from "../apiCalls.js";

export const getReservations = async req => {
  try {
    const url = new URL(req.url);

    const unsafeUserId = url.searchParams.get('userId');
    const unsafeComputerId = url.searchParams.get('computerId');
    const unsafeFrom = url.searchParams.get('from');
    const unsafeTo = url.searchParams.get('to');

    const validation = await getReservationsSchema.safeParseAsync({
      userId: unsafeUserId,
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
            between(reservationsTable.startDateTime, validation.data.from, validation.data.to)//todo test if should be new Date(from)...
          )
        );

      for (const reservation of reservations) {
        reservation.computer = await getComputerUnwrapped(reservation.id);
        delete reservation.computerId;
      }

      return Response.json(reservations, {status: 200});
    }

    const validationUserId = uuidSchema.safeParse(unsafeUserId);

    if (validationUserId.success) {
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
