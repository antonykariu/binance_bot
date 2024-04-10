import { logger } from "./logger.js";
import createWebSocket from "./websocket.js";
import { handleWebSocketMessage } from "./websocketManager.js";

import { tradeState } from "./state.js";

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
    ws.on("message", (data) =>  handleWebSocketMessage(data, tradeState, logger));
    ws.on("close", handleWebSocketClose);
    ws.on("error", handleWebSocketError);

    process.on("SIGINT", () => closeWebSocket(ws));
  } catch (error) {
    logger.error("Error initializing WebSocket:", error);
  }
};

initWebSocket();
