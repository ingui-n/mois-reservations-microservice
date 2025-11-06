import {db} from "../db/database.js";
import {reservationsTable} from "../db/schema.js";
import {and, eq, gt, isNull} from "drizzle-orm";
import {uuidSchema} from "../lib/validationSchemas.js";

export const deleteReservation = async req => {
  try {
    let unsafeId = req.params.id;

    const validation = uuidSchema.safeParse(unsafeId);//todo use parse()

    if (!validation.success) {
      return Response.json('Bad request', {status: 400});
    }

    const updatedReservations = await db.update(reservationsTable)
      .set({deletedAt: new Date()})
      .where(
        and(
          eq(reservationsTable.id, validation.data),
          gt(reservationsTable.startDateTime, new Date()),
          isNull(reservationsTable.deletedAt)
        )
      );

    if (updatedReservations.rowCount === 0) {
      return Response.json('Not found', {status: 404});
    }

    return new Response(null, {status: 200});
  } catch (e) {
    console.error(e);

    return new Response(e.message, {status: 500});
  }
};
