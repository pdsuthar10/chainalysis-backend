import CoinGecko from 'coingecko-api';

// Initiate the CoinGecko API Client
const CoinGeckoClient = new CoinGecko();

/**
 * I will be using the following 2 different exchanges for the application
 * 1. gdax - Coinbase Exchange
 * 2. bitfinex - Bitfinex
*/
const EXCHANGES_ID = ['gdax', 'bitfinex'];

/**
 * Returns sell price according to bid ask spread
 * @param buyPrice
 * @param bidAskSpreadPercentage
 * @returns {string}
 */
const getSellPrice = (buyPrice, bidAskSpreadPercentage) => Number(
  (buyPrice - (buyPrice * bidAskSpreadPercentage) / 100),
).toFixed(3);

/**
 * Returns an array of exchanges for a
 * particular coin with buy/sell prices
 * @param coinId
 * @param CoinGeckoClient
 * @returns {Promise<*[]>}
 */
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

/**
 * Gathers info about Bitcoin and Ethereum
 * @param socket
 * @returns {Promise<void>}
 */
const getApiAndEmit = async (socket) => {
  const bitcoin = await getCoinInfo('bitcoin');
  const ethereum = await getCoinInfo('ethereum');

  const response = { bitcoin, ethereum };

  // Emitting a new message. Will be consumed by the client
  socket.emit('FromAPI', response);
};

export default {
  getApiAndEmit,
};
