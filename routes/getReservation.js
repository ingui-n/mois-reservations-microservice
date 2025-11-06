import {eq} from "drizzle-orm";
import {reservationsTable} from "../db/schema.js";
import {db} from "../db/database.js";
import {uuidSchema} from "../lib/validationSchemas.js";
import {getComputerUnwrapped} from "../lib/apiCalls.js";

export const getReservation = async req => {
  try {
    let unsafeId = req.params.id;

    const validation = uuidSchema.safeParse(unsafeId);

    if (!validation.success) {
      return Response.json('Bad request', {status: 400});
    }

    const [reservation] = await db.select()
      .from(reservationsTable)
      .where(
        eq(reservationsTable.id, validation.data)
      )
      .limit(1);

    if (reservation) {
      reservation.computer = await getComputerUnwrapped(reservation.id);
      delete reservation.computerId;
    }

    return Response.json(reservation, {status: 200});
  } catch (e) {
    console.error(e);

    return new Response(e.message, {status: 500});
  }
};
