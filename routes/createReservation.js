import {db} from "../db/database.js";
import {reservationsTable} from "../db/schema.js";
import {and, between, count, eq, gt, gte, isNull, lte, or} from "drizzle-orm";
import {createReservationSchema} from "../validationSchemas.js";
import {getComputerUnwrapped} from "../apiCalls.js";

export const createReservation = async req => {
  try {
    const url = new URL(req.url);

    const unsafeComputerId = url.searchParams.get('computerId');
    const unsafeUserId = url.searchParams.get('userId');
    const unsafeStartDateTime = url.searchParams.get('startDateTime');
    const unsafeEndDateTime = url.searchParams.get('endDateTime');

    const validation = await createReservationSchema.safeParseAsync({
      userId: unsafeUserId,
      computerId: unsafeComputerId,
      startDateTime: unsafeStartDateTime,
      endDateTime: unsafeEndDateTime
    });

    if (!validation.success) {
      return Response.json('Bad request', {status: 400});
    }

    const {userId, computerId, startDateTime, endDateTime} = validation.data;

    //todo test: get computer -> must be available

    const computer = await getComputerUnwrapped(computerId);

    if (!computer || computer.available === false) {//todo check if computer.available or computer.data.available
      return Response.json('Computer doesn\'t exists or is not available', {status: 400});
    }

    const faculty = await getFaculty(computer.computerRoom.facultyId);

    if (!faculty) {
      return Response.json('Faculty not found', {status: 404});
    }

    //todo test: kontrola množství rezervací uživatele - maxUserReservationCount

    const userReservationsCount = await db.select({count: count()})
      .from(reservationsTable)
      .where(
        and(
          eq(reservationsTable.userId, userId),
          gt(reservationsTable.startDateTime, new Date()),
          isNull(reservationsTable.deletedAt)
        )
      );

    if (userReservationsCount > faculty.maxUserReservationCount) {//todo test
      return Response.json('You are currently on reservations limit', {status: 403});
    }

    //todo test: kontrola max týdenních rezervací - maxUserReservationTimeWeekly

    const today = new Date();
    const daysUntilNextSunday = (7 - today.getDay()) % 7 || 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilNextSunday);

    const userReservationsWeekly = await db.select()
      .from(reservationsTable)
      .where(
        and(
          eq(reservationsTable.userId, userId),
          between(reservationsTable.startDateTime, today, nextSunday),//todo test
          isNull(reservationsTable.deletedAt)
        )
      );

    let weeklySumMinutes = Math.abs((startDateTime - endDateTime) / 60000);

    for (const reservation of userReservationsWeekly) {
      weeklySumMinutes += Math.abs((reservation.startDateTime - reservation.endDateTime) / 60000);
    }

    if (weeklySumMinutes >= faculty.maxUserReservationTimeWeekly) {//todo test
      return Response.json('You are currently on reservations limit for this week', {status: 403});
    }

    //todo test: kontrola délky rezervace - maxUserReservationTime

    const reservationLengthMinutes = Math.abs((startDateTime - endDateTime) / 60000);

    if (reservationLengthMinutes > faculty.maxUserReservationTime) {
      return Response.json('Reservation time is too long', {status: 403});
    }

    //todo test: kontrola začátku a konce rezervace - reservationDateStart - reservationDateEnd

    if (startDateTime.getHours() < faculty.reservationTimeStart) {
      return Response.json(`Reservation must start after ${faculty.reservationTimeStart}`, {status: 403});//todo set to show hours and minutes
    }

    if (endDateTime.getHours() > faculty.reservationTimeEnd) {
      return Response.json(`Reservation must end before ${faculty.reservationTimeEnd}`, {status: 403});//todo set to show hours and minutes
    }

    //todo test: kontrola překryvu rezervace s jinými

    await db.transaction(async (tx) => {
      const overlap = await tx.select()
        .from(reservationsTable)
        .where(and(
          eq(reservationsTable.computerId, computerId),
          isNull(reservationsTable.deletedAt),
          or(
            and(lte(reservationsTable.startDateTime, startDateTime), gte(reservationsTable.endDateTime, startDateTime)),
            and(lte(reservationsTable.startDateTime, endDateTime), gte(reservationsTable.endDateTime, endDateTime)),
            and(gte(reservationsTable.startDateTime, startDateTime), lte(reservationsTable.endDateTime, endDateTime))
          )
        ))
        .for('update');

      if (overlap.length > 0)
        return Response.json('Computer already reserved in this time range', {status: 403});

      const reservation = await tx.insert(reservationsTable)
        .values({
          id: crypto.randomUUID(),
          createdAt: new Date(),
          userId,
          computerId,
          password: crypto.randomUUID(),
          startDateTime,
          endDateTime,
        });

      if (reservation) {//todo test
        reservation.computer = await getComputerUnwrapped(reservation.id);
        delete reservation.computerId;
      }

      return Response.json(reservation, {status: 201});
    });
  } catch (e) {
    console.error(e);

    return new Response(e.message, {status: 500});
  }
};
