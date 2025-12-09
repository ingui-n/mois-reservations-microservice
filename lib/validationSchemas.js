import * as z from 'zod';
import moment from "./localizedMoment.js";

/**
 * vadiace a zároveň přetypování iso string na objekt moment
 * @type {ZodPipe<ZodString, ZodTransform<Awaited<*|moment.Moment>, output<ZodString>>>}
 */
const stringToDateSchema = z
  .string()
  .transform((iso) => moment(iso, moment.ISO_8601, true))
  .refine((m) => m.isValid(), {message: "Invalid date format"});

/**
 * validace uuid
 * @type {ZodUUID}
 */
export const uuidSchema = z.uuid();

/**
 * validace pro endpoint GET /reservations
 * @type {ZodObject<Writeable<{userId: ZodCatch<ZodOptional<ZodUUID>>, computerId: ZodCatch<ZodOptional<ZodInt>>, from: ZodCatch<ZodOptional<ZodPipe<ZodFirstPartyTypeKind.ZodString, ZodTransform<Awaited<*|moment.Moment>, output<ZodFirstPartyTypeKind.ZodString>>>>>, to: ZodCatch<ZodOptional<ZodPipe<ZodFirstPartyTypeKind.ZodString, ZodTransform<Awaited<*|moment.Moment>, output<ZodFirstPartyTypeKind.ZodString>>>>>}>, $strip>}
 */
export const getReservationsSchema = z.object({
  userId: z.uuid()
    .optional()
    .catch(undefined),
  computerId: z.int('Invalid computer id')
    .min(1)
    .optional()
    .catch(undefined), //z.union([z.uuid(), z.int()]),
  from: stringToDateSchema.optional()
    .catch(undefined),
  to: stringToDateSchema.optional()
    .catch(undefined),
}).refine(
  ({from, to}) => from && to ? from.isBefore(to) : true,
  {
    message: 'Filter times are reversed or the same',
    path: ["from"],
  }
);

/**
 * validace pro endpoint POST /reservation
 * @type {ZodObject<Writeable<{userId: ZodUUID, computerId: ZodInt, startDateTime: ZodPipe<ZodFirstPartyTypeKind.ZodString, ZodTransform<Awaited<*|moment.Moment>, output<ZodFirstPartyTypeKind.ZodString>>>, endDateTime: ZodPipe<ZodFirstPartyTypeKind.ZodString, ZodTransform<Awaited<*|moment.Moment>, output<ZodFirstPartyTypeKind.ZodString>>>}>, $strip>}
 */
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
