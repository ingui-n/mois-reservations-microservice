import * as z from 'zod';
import moment from "./localizedMoment.js";

const stringToDateSchema = z
  .string()
  .transform((iso) => moment(iso, moment.ISO_8601, true))
  .refine((m) => m.isValid(), {message: "Invalid date format"});

export const uuidSchema = z.uuid();

export const getReservationsSchema = z.object({
  computerId: z.uuid(),
  from: z.iso.datetime(),//todo set stringToDateSchema
  to: z.iso.datetime(),
}).refine(
  ({from, to}) => new Date(from) < new Date(to),
  {
    message: '"from" must be earlier than "to"',
    path: ["from"],
  }
);

export const createReservationSchema = z.object({
  userId: z.uuid(),
  computerId: z.int(), //z.union([z.uuid(), z.int()]),
  startDateTime: stringToDateSchema,
  endDateTime: stringToDateSchema,
})
  .refine(
    ({startDateTime, endDateTime}) => startDateTime.isBefore(endDateTime),
    {
      message: 'End time of reservation cannot be before reservation starts',
      path: ["startDateTime"],
    }
  )
  .refine(
    ({startDateTime}) => moment().isBefore(startDateTime),
    {
      message: 'Reservation cannot be created in past',
      path: ["startDateTime"],
    }
  )
  .refine(
    ({startDateTime, endDateTime}) => startDateTime.isSame(endDateTime, 'day'),
    {
      message: 'Reservation must be within one day',
      path: ["startDateTime"],
    }
  );
