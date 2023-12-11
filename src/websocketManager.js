import { logger } from "./logger.js";
import {
  isTradeConditionMet,
  executeTradeLogic,
  executeExitLogic,
  shouldExit,
} from "./tradeLogic.js";

export const handleWebSocketMessage = (data, tradeState, logger) => {
  const klineData = JSON.parse(data);
  const { k: kline } = klineData;

  if (kline.x) {
    logger.info("Kline x reached");
    handleKlineEvent(kline, tradeState, logger);
  }
  if (tradeState.open) {
    adjustTrailingStop(kline, tradeState);
    if (shouldExit(parseFloat(kline.c), tradeState)) {
      executeExitStrategy(kline, tradeState);
    }
  }
};

const handleKlineEvent = (kline, tradeState, logger) => {
  logger.info("handling kline event");
  logger.info(JSON.stringify(kline));
  logger.info(JSON.stringify(tradeState));
  if (!tradeState.open) {
    const { v: volume, o: open, c: close } = kline;

    logger.info("passing kline to condition met");

    if (isTradeConditionMet(volume, open, close)) {
      executeTradeAtCandleClose(kline, tradeState, logger);
    }
  }
};

const executeTradeAtCandleClose = (kline, tradeState, logger) => {
  logger.info("Executing trade at hourly candle close...");
  tradeState.price = parseFloat(kline.c);
  tradeState.open = true;
  tradeState.stop = parseFloat(kline.c) - tradeState.trailOffset;
  tradeState.trailPrice = tradeState.stop;
  logger.info(JSON.stringify(tradeState));
  executeTradeLogic(tradeState, kline);
};

const adjustTrailingStop = (kline, tradeState) => {
  const close = parseFloat(kline.c);

  if (
    tradeState.stop === tradeState.trailPrice &&
    close > tradeState.trailPrice + 14
  ) {
    tradeState.trailPrice += 7;
    logger.info(
      "adjusting trailprice for the first time" + tradeState.trailPrice
    );
  }

  if (
    tradeState.stop !== tradeState.trailPrice &&
    close > tradeState.trailPrice + 7
  ) {
    tradeState.trailPrice =
      tradeState.trailPrice + (close - tradeState.trailPrice + 7);
    logger.info("adjusting trailprice" + tradeState.trailPrice);
  }
};

const executeExitStrategy = (kline, tradeState) => {
  const { o: open, c: close, h: high, l: low, v: volume } = kline;
  executeExitLogic(
    parseFloat(open),
    parseFloat(high),
    parseFloat(low),
    parseFloat(close),
    parseFloat(volume),
    tradeState
  );
};
