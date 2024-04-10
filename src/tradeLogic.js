import { airtableBase, binanceClient, taapi } from "./services.js";
import { logger } from "./logger.js";
import { initialTradeState } from "./state.js";

export const isTradeConditionMet = async (volume, open, close) => {
  logger.info("Reached condition met");
  volume = parseFloat(volume);
  open = parseFloat(open);
  close = parseFloat(close);

  const RSI = await taapi.getIndicator("rsi", "BTC/USDT", "15m").then( rsi => rsi.value);

  console.log("taapi", volume, RSI)

  if (volume > 19000 && RSI < 30 || RSI > 70) {
    return true
  } else {
    return  false
  }
};

export const executeTradeLogic = (tradeState, kline) => {
  const { o: open, h: high, l: low, c: close, v: volume } = kline;

  executeTrade(
    tradeState,
    "LONG",
    "Entry",
    "BUY",
    open,
    high,
    low,
    close,
    volume
  );
};

export const executeExitLogic = async (
  open,
  high,
  low,
  close,
  volume,
  tradeState
) => {
  await exitTrade(
    tradeState,
    "LONG",
    "Exit",
    "BUY",
    open,
    high,
    low,
    close,
    volume
  );
};

const executeTrade = async (
  tradeState,
  direction,
  type,
  side,
  open,
  high,
  low,
  close,
  volume
) => {
  Date.prototype.addDays = function (days) {
    const newDate = new Date(this.valueOf());
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  const currentDate = new Date();
  const futureDate = currentDate.addDays(2); // Add 2 days

  const order = {
    symbol: tradeState.SYMBOL,
    side,
    positionSide: direction,
    type: "LIMIT",
    quantity: tradeState.size,
    price: tradeState.price,
    timeInForce: "GTC",
  };

  try {
    const response = await binanceClient.submitNewOrder(order);

    tradeState.orderId = response.orderId;

    open = parseFloat(open);
    high = parseFloat(high);
    low = parseFloat(low);
    close = parseFloat(close);
    volume = parseFloat(volume);

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
  } catch (err) {
    logger.error(err);
  }
};

const exitTrade = async (
  tradeState,
  side,
  direction,
  type,
  open,
  high,
  low,
  close,
  volume
) => {
  const order = {
    symbol: tradeState.SYMBOL,
    side,
    type: "STOP_MARKET",
    quantity: tradeState.size,
    stopPrice: tradeState.stop-1,
    closePosition: true,
    timeInForce: "GTC",
  };

  try {
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
  } catch (err) {
    logger.error(err);
  }
};

export const shouldExit = (tradeState, close) => {
  if (tradeState.stop === tradeState.trailPrice) {
    return close < tradeState.stop;
  } else {
    return close < tradeState.trailPrice;
  }
};
