import {createReservation, deleteReservation, getReservation, getReservations} from "./routes.js";

Bun.serve({
  port: 3000,
  routes: {
    '/status': () => new Response('OK'),

    '/reservations': {
      GET: getReservations,
    },
    '/reservation': {
      GET: getReservation,
      POST: createReservation,
    },
    '/reservation/:id': {
      DELETE: deleteReservation,
    },
  },

  fetch(req) {
    console.error('Requested route not found:', req);
    return new Response("Not Found", {status: 404});
  },
});

console.log('Server started on port 3000');
