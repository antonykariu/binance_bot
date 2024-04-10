import { logger } from "./logger.js";
import {
  isTradeConditionMet,
} from "./tradeLogic.js";

export const handleWebSocketMessage = (data, tradeState, logger) => {
  const klineData = JSON.parse(data);
  const { k: kline } = klineData;

  if (Object.keys(kline).includes("x")) {
    if (kline.x) {
      handleKlineEvent(kline, tradeState, logger);      
    }
  }
};

const handleKlineEvent = (kline, tradeState, logger) => {
  if (!tradeState.open) {
    const { v: volume, o: open, c: close, h: high, l: low } = kline;

    logger.info("Start of Kline event");
    isTradeConditionMet(volume, open, close, high, low, tradeState)
  }
};