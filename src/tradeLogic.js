import { airtableBase, binanceClient } from "./services.js";
import { logger } from "./logger.js";

const initialTradeState = {
  orderId: 0,
  open: false,
  price: 0,
  trailPrice: 0,
  trailOffset: 7,
  stop: 0,
  size: 0.01,
  symbol: "ethusdt_perpetual",
  SYMBOL: "ETHUSDT",
};

export const isTradeConditionMet = (volume, open, close) => {
  volume = parseFloat(volume);
  open = parseFloat(open);
  close = parseFloat(close);
  return volume > 200000 && open > close && open - close > 18;
};

export const executeTradeLogic = async (tradeState, open, high, low, close, volume) => {
  const executedTrade = await executeTrade(tradeState, "LONG", "Entry", "BUY", open, high, low, close, volume);
  return executedTrade;
};

export const executeExitLogic = async (tradeState, open, high, low, close, volume) => {
  const exitedTrade = await exitTrade(tradeState, "SELL", "LONG", "Exit", open, high, low, close, volume);
  return exitedTrade;
};

const executeTrade = async (tradeState, direction, type, side, open, high, low, close, volume) => {
  const order = {
    symbol: tradeState.SYMBOL,
    side,
    positionSide: direction,
    type: "LIMIT",
    quantity: tradeState.size,
    price: tradeState.price,
    timeInForce: "GTC",
  };

  const response = await binanceClient.submitNewOrder(order);

  tradeState.orderId = response.orderId;

  const tradeDetails = {
    orderId: response.orderId,
    status: response.status,
    symbol: tradeState.SYMBOL,
    Time: new Date(response.updateTime),
    raw: JSON.stringify(response),
    Price: parseFloat(response.price),
    open,
    high,
    low,
    close,
    volume,
    Direction: direction,
    Type: type,
  };

  airtableBase("Trades").create(tradeDetails, (err, record) => {
    if (err) {
      logger.error(err);
      return;
    }

    logger.info(`Trade details saved. Record ID: ${record.getId()}`);
  });

  return tradeDetails;
};

const exitTrade = async (tradeState, side, direction, type, open, high, low, close, volume) => {
  const order = {
    symbol: tradeState.SYMBOL,
    side,
    type: "STOP_MARKET",
    quantity: tradeState.size,
    stopPrice: tradeState.stop,
    closePosition: true,
    timeInForce: "GTC",
  };

  const response = await binanceClient.submitNewOrder(order);

  const tradeDetails = {
    orderId: response.orderId,
    status: response.status,
    symbol: tradeState.SYMBOL,
    Time: new Date(response.updateTime),
    raw: JSON.stringify(response),
    Price: parseFloat(response.price),
    open,
    high,
    low,
    close,
    volume,
    Direction: direction,
    Type: type,
  };

  airtableBase("Trades").create(tradeDetails, (err, record) => {
    if (err) {
      logger.error(err);
      return;
    }

    logger.info(`Trade details saved. Record ID: ${record.getId()}`);
  });

  tradeState = initialTradeState;
  return tradeDetails;
};

export const shouldExit = (tradeState, close) => {
  if (tradeState.stop === tradeState.trailPrice) {
    return close < tradeState.stop;
  } else {
    return close < tradeState.trailPrice;
  }
};
