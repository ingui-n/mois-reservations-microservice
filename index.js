import {getReservations} from "./routes/getReservations.js";
import {getReservation} from "./routes/getReservation.js";
import {deleteReservation} from "./routes/deleteReservation.js";
import {createReservation} from "./routes/createReservation.js";

Bun.serve({
  port: 3000,
  routes: {
    '/status': () => new Response('OK'),

    '/reservations': {
      GET: getReservations,
    },
    '/reservation': {
      POST: createReservation,
    },
    '/reservation/:id': {
      GET: getReservation,
      DELETE: deleteReservation,
    },
  },

  /**
   * catch all cesty, které nejsou definované výš
   * @param req
   * @returns {Response}
   */
  fetch(req) {
    console.error('Requested route not found:', req);
    return new Response("Not Found", {status: 404});
  },
});

console.log('Server started on port 3000');
