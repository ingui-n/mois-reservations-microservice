import * as z from 'zod';
import moment from "./localizedMoment.js";

const stringToDateSchema = z
  .string()
  .transform((iso) => moment(iso, moment.ISO_8601, true))
  .refine((m) => m.isValid(), {message: "Invalid date format"});

export const uuidSchema = z.uuid();

export const getReservationsSchema = z.object({
  computerId: z.int('Invalid computer id'), //z.union([z.uuid(), z.int()]),
  from: stringToDateSchema,
  to: stringToDateSchema,
}).refine(
  ({from, to}) => from.isBefore(to),
  {
    message: 'Filter times are reversed or the same',
    path: ["from"],
  }
);

export const createReservationSchema = z.object({
  userId: z.uuid('Invalid user id'),
  computerId: z.int('Invalid computer id'), //z.union([z.uuid(), z.int()]),
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
