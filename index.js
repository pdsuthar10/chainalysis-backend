import { createServer } from 'http';
import Express from 'express';
import { Server } from 'socket.io';
import BodyParser from 'body-parser';
import cors from 'cors';
import CoinGecko from 'coingecko-api';

import Config from './config';
//
// Build a basic express app
const app = Express();
// const serverInstance = createServer(app);
const { port } = Config.server;

// Initiate the CoinGecko API Client
const CoinGeckoClient = new CoinGecko();

// I will be using the following 2 different exchanges for the application
// gdax - Coinbase Exchange
// bitfinex - Bitfinex
const EXCHANGES_ID = ['gdax', 'bitfinex'];
//
//
// Parse JSON bodies of requests
app.use(BodyParser.json());

// Add CORS headers to allow everything; this is obviously unsafe in the real world but
// for this example it's fine.
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

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const getSellPrice = (buyPrice, bidAskSpreadPercentage) => Number((buyPrice - (buyPrice * bidAskSpreadPercentage) / 100)).toFixed(3);

const getCoinInfo = async (coinId) => {
  let response;
  try {
    const result = await CoinGeckoClient.coins.fetch(coinId);
    const { data, success } = result;

    if (!success) {
      throw new Error(JSON.stringify(result));
    }

    response = data.tickers
      .filter((entry) => EXCHANGES_ID.includes(entry.market.identifier) && (entry.target === 'USD'))
      .map((entry) => ({
        name: entry.market.name,
        identifier: entry.market.identifier,
        buy: Number(entry.last).toFixed(2),
        sell: getSellPrice(entry.last, entry.bid_ask_spread_percentage),
      }));
  } catch (err) {
    console.log(err);
    response = [];
  }

  return response;
};

const getApiAndEmit = async (socket) => {
  console.log('Hello world');

  const bitcoin = await getCoinInfo('bitcoin');
  const ethereum = await getCoinInfo('ethereum');

  const response = { bitcoin, ethereum };

  // Emitting a new message. Will be consumed by the client
  socket.emit('FromAPI', response);
};

io.on('connection', (socket) => {
  console.log('Connection established');

  const intervalId = setInterval(() => getApiAndEmit(socket), 5000);

  // handle the event sent with socket.send()
  socket.on('message', (data) => {
    console.log(data);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected');

    clearInterval(intervalId);
    console.log('Interval Cleared!');
  });
});

// Start it listening.  This is the top level so we can't use await.
server.listen(port, () => console.log(`Crypto data app listening on port ${port}!`));
