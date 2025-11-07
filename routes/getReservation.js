import {and, eq, isNull} from "drizzle-orm";
import {reservationsTable} from "../db/schema.js";
import {db} from "../db/database.js";
import {uuidSchema} from "../lib/validationSchemas.js";
import {getComputerUnwrapped} from "../lib/apiCalls.js";
import {z} from "zod";
import {getAuthHeaders} from "../lib/authHeaders.js";

export const getReservation = async req => {
  try {
    let unsafeId = req.params.id;
    const {userId: headersUserId, userRoles: headersUserRoles} = getAuthHeaders(req.headers);

    const uuid = uuidSchema.parse(unsafeId);

    const [reservation] = await db.select()
      .from(reservationsTable)
      .where(
        and(
          eq(reservationsTable.id, uuid),
          isNull(reservationsTable.deletedAt)
        )
      )
      .limit(1);

    if (!reservation) {
      return new Response('No reservation found', {status: 404});
    }

    reservation.computer = await getComputerUnwrapped(reservation.computerId);
    delete reservation.computerId;

    if (!headersUserRoles.includes(Bun.env.ROLE_ADMIN) && reservation.userId !== headersUserId) {
      delete reservation.password;
      delete reservation.deletedAt;
    }

    return Response.json(reservation, {status: 200});
  } catch (err) {
    console.error(err);

    if (err instanceof z.ZodError) {
      return Response.json(err.issues[0].message || 'Bad request', {status: 400});
    }

    return new Response(err.message, {status: 500});
  }
};
