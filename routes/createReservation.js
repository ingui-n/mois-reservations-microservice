import {db} from "../db/database.js";
import {reservationsTable} from "../db/schema.js";
import {and, between, count, eq, gt, gte, isNull, lte, or, lt} from "drizzle-orm";
import {createReservationSchema} from "../lib/validationSchemas.js";
import {getComputerUnwrapped, getFaculty} from "../lib/apiCalls.js";
import {getAuthHeaders} from "../lib/authHeaders.js";
import {z} from "zod";
import moment from "../lib/localizedMoment.js";
import {isTimeAfterDateTime, isTimeBeforeDateTime} from "../lib/utilities/dateTime.js";
import {generateRandomString} from "../lib/utilities/textGenerator.js";

export const createReservation = async req => {
  try {
    const body = await req.body.json();

    const {userId: headersUserId} = getAuthHeaders(req.headers);

    const {userId, computerId, startDateTime, endDateTime} = await createReservationSchema.parse(body);

    if (headersUserId !== userId) {
      return Response.json('Forbidden', {status: 403});
    }

    /** test: get computer -> must be available */

    const computer = await getComputerUnwrapped(computerId);

    if (!computer || computer.available === false) {
      return Response.json('Computer doesn\'t exists or is not available', {status: 400});
    }

    const faculty = await getFaculty(computer.computerRoom.faculty.facultyId);

    if (!faculty) {
      return Response.json('Faculty not found', {status: 404});
    }

    /** test: kontrola množství rezervací uživatele - maxUserReservationCount */

    const userReservationsCount = await db.select({count: count()})
      .from(reservationsTable)
      .where(
        and(
          eq(reservationsTable.userId, userId),
          gt(reservationsTable.startDateTime, moment()),
          isNull(reservationsTable.deletedAt)
        )
      ).then(x => x[0].count);

    if (userReservationsCount >= faculty.maxUserReservationCount) {
      return Response.json('You are currently on reservations limit', {status: 403});
    }

    /** test: kontrola délky rezervace - maxUserReservationTime */

    const reservationLengthMinutes = endDateTime.diff(startDateTime, 'minutes');

    if (reservationLengthMinutes > faculty.maxUserReservationTime) {
      return Response.json(`Maximum time for a reservation is ${faculty.maxUserReservationTime / 60} hour(s)`, {status: 403});
    }

    /** test: kontrola max týdenních rezervací - maxUserReservationTimeWeekly */

    const weekStart = moment(startDateTime).startOf('isoWeek').startOf('day');
    const weekEnd = moment(startDateTime).endOf('isoWeek').endOf('day');

    const userReservationsWeekly = await db.select()
      .from(reservationsTable)
      .where(
        and(
          eq(reservationsTable.userId, userId),
          between(reservationsTable.startDateTime, weekStart, weekEnd),
          isNull(reservationsTable.deletedAt)
        )
      );

    let weeklySumMinutes = endDateTime.diff(startDateTime, 'minutes');

    for (const reservation of userReservationsWeekly) {
      weeklySumMinutes += moment(endDateTime).diff(moment(startDateTime), 'minutes');
    }

    if (weeklySumMinutes >= faculty.maxUserReservationTimeWeekly) {
      return Response.json('You are currently on reservations limit for this week', {status: 403});
    }

    /** test: kontrola začátku a konce rezervace - reservationDateStart - reservationDateEnd */

    if (isTimeBeforeDateTime(faculty.reservationTimeEnd, endDateTime)) {
      return Response.json(`Reservation must end before ${faculty.reservationTimeEnd}`, {status: 403});
    }

    if (isTimeAfterDateTime(faculty.reservationTimeStart, startDateTime)) {
      return Response.json(`Reservation must start after ${faculty.reservationTimeStart}`, {status: 403});
    }

    const result = await db.transaction(async (tx) => {
      /** test: kontrola překryvu rezervace s jinými */

      const overlap = await tx.select()
        .from(reservationsTable)
        .where(and(
          eq(reservationsTable.computerId, computerId),
          isNull(reservationsTable.deletedAt),
          or(
            // new start is inside an existing reservation
            and(lt(reservationsTable.startDateTime, startDateTime), gt(reservationsTable.endDateTime, startDateTime)),
            // new end is inside an existing reservation
            and(lt(reservationsTable.startDateTime, endDateTime), gt(reservationsTable.endDateTime, endDateTime)),
            // existing reservation completely contained within the new one
            and(lte(reservationsTable.endDateTime, endDateTime), gte(reservationsTable.startDateTime, startDateTime))
          )
        ))
        .for('update');

      if (overlap.length > 0) {
        throw new Error('OVERLAP');
      }

      const [reservation] = await tx.insert(reservationsTable)
        .values({
          userId,
          computerId,
          password: generateRandomString(),
          startDateTime,
          endDateTime,
        })
        .returning();

      return reservation;
    });

    result.computer = computer;
    delete result.computerId;

    return Response.json(result, {status: 201});
  } catch (err) {
    console.error(err);

    if (err instanceof z.ZodError) {
      return Response.json(err.issues[0].message || 'Bad request', {status: 400});
    }

    if (err.message === 'OVERLAP') {
      return Response.json('Computer is already reserved in this time range', {status: 403});
    }

    return new Response(err.message, {status: 500});
  }
};
