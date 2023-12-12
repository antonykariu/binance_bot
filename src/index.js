import { logger } from "./logger.js";
import createWebSocket from "./websocket.js";
import { handleWebSocketMessage } from "./websocketManager.js";

let tradeState = {
  orderId: 0,
  open: false,
  price: 0,
  trailPrice: 0,
  trailOffset: 7,
  stop: 0,
  size: 0.4,
  symbol: "ethusdt_perpetual",
  SYMBOL: "ETHUSDT",
};

const logWebSocketMessage = () => {
  logger.info("WebSocket is still running...");
};

const closeWebSocket = (ws) => {
  logger.info("Closing WebSocket connection...");
  ws.close();
  process.exit();
};

const handleWebSocketOpen = () => {
  logger.info("WebSocket connection opened");
};

const handleWebSocketClose = (code, reason) => {
  if (code === 1000) {
    logger.info("WebSocket connection closed gracefully");
  } else {
    logger.warn(
      `WebSocket connection closed unexpectedly. Code: ${code}, Reason: ${reason}`
    );
  }
};

const handleWebSocketError = (err) => {
  logger.error("WebSocket error:", err);
};

const initWebSocket = async () => {
  try {
    const { ws } = await createWebSocket(tradeState.symbol);

    ws.on("open", handleWebSocketOpen);
    ws.on("message", (data) => handleWebSocketMessage(data, tradeState, logger));
    ws.on("close", handleWebSocketClose);
    ws.on("error", handleWebSocketError);

    // Log a message every minute to show the WebSocket is running
    setInterval(logWebSocketMessage, 60 * 1000); // 60 seconds * 1000 milliseconds

    process.on("SIGINT", () => closeWebSocket(ws));
  } catch (error) {
    logger.error("Error initializing WebSocket:", error);
  }
};

initWebSocket();
