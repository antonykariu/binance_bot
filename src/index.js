import { airtableBase, binanceClient } from "./services.js";
import createWebSocket from "./websocket.js";
import winston from "winston";

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "app.log" }),
  ],
});

const tradeState = {
  orderId: 0,
  open: false,
  price: 0,
  trailPrice: 0,
  trailOffset: 0,
  stop: 0,
  size: 0.01,
  symbol: "ethusdt_perpetual",
  SYMBOL: "ETHUSDT",
};

const initial = {
  orderId: 0,
  open: false,
  price: 0,
  trailPrice: 0,
  trailOffset: 0,
  stop: 0,
  size: 0.01,
  symbol: "ethusdt_perpetual",
  SYMBOL: "ETHUSDT",
};

const initWebSocket = async () => {
  try {
    const { ws } = await createWebSocket(tradeState.symbol);

    ws.on("open", () => {
      logger.info("WebSocket connection opened");
    });

    ws.on("message", handleWebSocketMessage);

    ws.on("close", (code, reason) => {
      if (code === 1000) {
        logger.info("WebSocket connection closed gracefully");
      } else {
        logger.warn(
          `WebSocket connection closed unexpectedly. Code: ${code}, Reason: ${reason}`
        );
      }
    });

    ws.on("error", (err) => {
      logger.error("WebSocket error:", err);
    });

    // Log a message every minute to show the WebSocket is running
    setInterval(() => {
      logger.info("WebSocket is still running...");
    }, 60 * 1000); // 60 seconds * 1000 milliseconds

    process.on("SIGINT", () => {
      logger.info("Closing WebSocket connection...");
      ws.close();
      process.exit();
    });
  } catch (error) {
    logger.error("Error initializing WebSocket:", error);
  }
};

const handleWebSocketMessage = (data) => {
  const klineData = JSON.parse(data);
  const { e: eventType, k: kline } = klineData;

  if (eventType === "kline" && kline.x && !tradeState.open) {
    const { v: volume, o: open, c: close, h: high, l: low } = kline;

    if (isTradeConditionMet(volume, open, close)) {
      logger.info("Executing trade at hourly candle close...");
      tradeState.price = parseFloat(close);
      tradeState.open = true;
      tradeState.stop = parseFloat(close) - 7;
      executeTradeLogic(open, high, low, close, volume);
    }
  }

  if (tradeState.open) {
    let { o: open, c: close, h: high, l: low, v: volume } = kline;
    close = parseFloat(close);

    if (shouldExit(close)) {
      open = parseFloat(open);
      high = parseFloat(high);
      low = parseFloat(low);
      volume = parseFloat(volume);
      logger.info("Executing exit strategy...");
      executeExitLogic(open, high, low, close, volume);
    }
  }
};

const isTradeConditionMet = (volume, open, close) => {
  return volume > 200000 && open > close && open - close > 18;
};

const executeTradeLogic = (open, high, low, close, volume) => {
  open = parseFloat(open);
  high = parseFloat(high);
  low = parseFloat(low);
  close = parseFloat(close);
  volume = parseFloat(volume);
  executeTrade("LONG", "Entry", "BUY", open, high, low, close, volume);
};

const executeExitLogic = (open, high, low, close, volume) => {
  exitTrade("SELL", "LONG", "Exit", open, high, low, close, volume);
};

const executeTrade = async (
  direction,
  type,
  side,
  open,
  high,
  low,
  close,
  volume
) => {
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
};

const exitTrade = async (
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
    stopPrice: tradeState.stop - 3,
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

  tradeState = initial;
};

const shouldExit = (close) => {
  return close < tradeState.stop;
};

initWebSocket();
