import {db} from "../db/database.js";
import {reservationsTable} from "../db/schema.js";
import {and, eq, isNull, lt} from "drizzle-orm";
import {uuidSchema} from "../validationSchemas.js";

export const deleteReservation = async req => {
  try {
    const url = new URL(req.url);
    let unsafeId = url.searchParams.get('id');

    const validation = uuidSchema.safeParse(unsafeId);

    if (!validation.success) {
      return Response.json('Bad request', {status: 400});
    }

    const reservation = await db.update(reservationsTable)
      .set({deletedAt: new Date()})//todo test if needs to be isostring
      .where(
        and(
          eq(reservationsTable.id, validation.data),
          lt(reservationsTable.startDateTime, new Date()),
          isNull(reservationsTable.deletedAt)
        )
      );

    console.log(reservation)//todo test condition

    if (reservation) {
      return Response.json(reservation, {status: 200});
    }

    return Response.json('Not found', {status: 404});
  } catch (e) {
    console.error(e);

    return new Response(e.message, {status: 500});
  }
};
