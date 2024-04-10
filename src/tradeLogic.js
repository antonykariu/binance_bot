import { airtableBase, binanceClient, taapi } from "./services.js";
import { logger } from "./logger.js";
import { initialTradeState } from "./state.js";

export const isTradeConditionMet = async (
  volume,
  open,
  close,
  high,
  low,
  tradeState
) => {
  logger.info("Reached condition met");
  volume = parseFloat(volume);
  open = parseFloat(open);
  close = parseFloat(close);

  const RSI = await taapi
    .getIndicator("rsi", "BTC/USDT", "15m")
    .then((rsi) => rsi.value);

  logger.info("volume "+volume, "rsi "+RSI);

  const test = true

  if ((volume > 19000 && RSI < 30) || RSI > 70 || test) {
    const percent = ((high - low) / open) * 100;
    const wick = ((close - low) / open) * 100;


    if (close > open || test) {
      if (
        (RSI > 25 && percent > 3.3) ||
        (RSI > 25 && RSI < 30) ||
        (RSI > 70 && wick > 0.1 && percent < 1.3) || test
      ) {
        const profit = ((100 + percent * 2 * 0.75) / 100) * high;
        const loss = low * 0.99;

        tradeState.price = low;
        tradeState.tp = profit;
        tradeState.sl = loss;

        

        // Place order
        // executeTrade(
        //   tradeState,
        //   "LONG",
        //   "Entry",
        //   "BUY",
        //   open,
        //   high,
        //   low,
        //   close,
        //   volume
        // );
      }
    }
    // else {
    //   if (
    //     (percent >= 2 && percent < 5) ||
    //     (percent > 2 && wick > 1.6 && percent < 5)
    //   ) {
    //     const profit = ((100 + percent * 2 * 0.75) / 100) * high;
    //     const loss = low * 0.99;

    //     tradeState.price = low;
    //     tradeState.tp = profit;
    //     tradeState.sl = loss;

    //     // Place order
    //     executeTrade(
    //       tradeState,
    //       "LONG",
    //       "Entry",
    //       "BUY",
    //       open,
    //       high,
    //       low,
    //       close,
    //       volume
    //     );
    //   } else if (percent < 2 && wick > 0.2 && RSI > 20) {
    //     const profit = ((100 + percent * 2 * 0.65) / 100) * high;
    //     const loss = low * 0.99;

    //     tradeState.price = low;
    //     tradeState.tp = profit;
    //     tradeState.sl = loss;

    //     // Place order
    //     executeTrade(
    //       tradeState,
    //       "LONG",
    //       "Entry",
    //       "BUY",
    //       open,
    //       high,
    //       low,
    //       close,
    //       volume
    //     );
    //   } else if (percent > 5) {
    //     const profit = ((100 + percent * 1 * 0.75) / 100) * high;
    //     const loss = low * 0.99;

    //     tradeState.price = low;
    //     tradeState.tp = profit;
    //     tradeState.sl = loss;

    //     // Place order
    //     executeTrade(
    //       tradeState,
    //       "LONG",
    //       "Entry",
    //       "BUY",
    //       open,
    //       high,
    //       low,
    //       close,
    //       volume
    //     );
    //   }
    // }

    return true;
  } else {
    return false;
  }
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

  const TPOrder = {
    symbol: tradeState.SYMBOL,
    side,
    positionSide: direction,
    type: "TAKE_PROFIT",
    quantity: tradeState.size,
    price: tradeState.tp,
    stopPrice: tradeState.tp,
    timeInForce: "GTC",
  };

  const SLOrder = {
    symbol: tradeState.SYMBOL,
    side,
    positionSide: direction,
    type: "STOP",
    quantity: tradeState.size,
    price: tradeState.sl,
    stopPrice: tradeState.sl,
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

    tradeState = { ...initialTradeState };
    logger.info("Reset trade state");
  } catch (err) {
    logger.error(err);
  }
};
