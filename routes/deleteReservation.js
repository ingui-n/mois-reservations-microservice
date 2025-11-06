import {db} from "../db/database.js";
import {reservationsTable} from "../db/schema.js";
import {and, eq, gt, isNull} from "drizzle-orm";
import {uuidSchema} from "../lib/validationSchemas.js";
import {z} from "zod";
import {getAuthHeaders} from "../lib/authHeaders.js";
import moment from "../lib/localizedMoment.js";

export const deleteReservation = async req => {
  try {
    let unsafeId = req.params.id;
    const {userId: headersUserId} = getAuthHeaders(req.headers);

    const uuid = uuidSchema.parse(unsafeId);

    const updatedReservations = await db.update(reservationsTable)
      .set({deletedAt: new Date()})
      .where(
        and(
          eq(reservationsTable.id, uuid),
          eq(reservationsTable.userId, headersUserId),
          gt(reservationsTable.startDateTime, moment()),
          isNull(reservationsTable.deletedAt)
        )
      );

    if (updatedReservations.rowCount === 0) {
      return Response.json('Not found', {status: 404});
    }

    return new Response(null, {status: 200});
  } catch (err) {
    console.error(err);

    if (err instanceof z.ZodError) {
      return Response.json(err.issues[0].message || 'Bad request', {status: 400});
    }

    return new Response(err.message, {status: 500});
  }
};
