import {
  isTradeConditionMet,
  executeTradeLogic,
  executeExitLogic,
  shouldExit,
} from "./tradeLogic.js";

export const handleWebSocketMessage = (data, tradeState, logger) => {
  const klineData = JSON.parse(data);
  const { e: eventType, k: kline } = klineData;

  if (eventType === "kline" && kline.x) {
    handleKlineEvent(kline, tradeState, logger);
  }
};

const handleKlineEvent = (kline, tradeState, logger) => {
  if (!tradeState.open) {
    const { v: volume, o: open, c: close, h: high, l: low } = kline;

    if (isTradeConditionMet(volume, open, close)) {
      executeTradeAtCandleClose(kline, tradeState, logger);
    }
  } else {
    adjustTrailingStop(kline, tradeState);
    if (shouldExit(parseFloat(kline.c), tradeState)) {
      executeExitStrategy(kline, tradeState);
    }
  }
};

const executeTradeAtCandleClose = (kline, tradeState, logger) => {
  logger.info("Executing trade at hourly candle close...");
  tradeState.price = parseFloat(kline.c);
  tradeState.open = true;
  tradeState.stop = parseFloat(kline.c) - tradeState.trailOffset;
  tradeState.trailPrice = tradeState.stop;
  executeTradeLogic(kline, tradeState);
};

const adjustTrailingStop = (kline, tradeState) => {
  const close = parseFloat(kline.c);

  if (
    tradeState.stop === tradeState.trailPrice &&
    close > tradeState.trailPrice + 14
  ) {
    tradeState.trailPrice += 7;
  }

  if (
    tradeState.stop !== tradeState.trailPrice &&
    close > tradeState.trailPrice + 7
  ) {
    tradeState.trailPrice =
      tradeState.trailPrice + (close - tradeState.trailPrice + 7);
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
