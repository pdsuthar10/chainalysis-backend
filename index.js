import { createServer } from 'http';
import Express from 'express';
import { Server } from 'socket.io';
import BodyParser from 'body-parser';
import cors from 'cors';
import controller from './controller';

import Config from './config';

// Build a basic express app
const app = Express();
const { port } = Config.server;

// Parse JSON bodies of requests
app.use(BodyParser.json());

// Add CORS headers to allow trusted domains
const allowedOrigins = [
  'https://chainalysis-frontend.herokuapp.com',
  'http://localhost:3000',
];
const corsOption = {
  origin: allowedOrigins,
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOption));

// Create a server and attach the socket
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Start sending data on connections
io.on('connection', (socket) => {
  console.log('Connection established');
  const intervalId = setInterval(() => controller.getApiAndEmit(socket), 5000);

  // handle the event sent with socket.send()
  socket.on('message', (data) => {
    console.log(data);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected');

    // Clearing the interval if disconnects
    clearInterval(intervalId);
    console.log('Interval Cleared!');
  });
});

// Start it listening.  This is the top level so we can't use await.
server.listen(port, () => console.log(`Crypto data app listening on port ${port}!`));
