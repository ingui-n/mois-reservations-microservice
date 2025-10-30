import * as z from 'zod';

export const uuidSchema = z.uuid();

export const getReservationsSchema = z.object({
  computerId: z.uuid(),
  from: z.iso.datetime(),
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
  computerId: z.uuid(),
  startDateTime: z.iso.datetime(),
  endDateTime: z.iso.datetime(),
}).refine(
  ({startDateTime, endDateTime}) => new Date(startDateTime) < new Date(endDateTime),
  {
    message: '"startDateTime" must be earlier than "endDateTime"',
    path: ["startDateTime"],
  }
);
