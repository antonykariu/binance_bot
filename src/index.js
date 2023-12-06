import { airtableBase } from "./services.js";
import createWebSocket from "./websocket.js";

const initWebSocket = async () => {
  const { ws } = await createWebSocket();

  ws.on("open", () => {
    console.log("WebSocket connection opened");
  });

  ws.on("message", handleWebSocketMessage);

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });

  process.on("SIGINT", () => {
    console.log("Closing WebSocket connection...");
    ws.close();
    process.exit();
  });
};

const handleWebSocketMessage = (data) => {
  const klineData = JSON.parse(data);
  const { e: eventType, k: kline } = klineData;

  if (eventType === "kline" && kline.x) {
    const { v: volume, o: open, c: close, h: high, l: low } = kline;

    if (isTradeConditionMet(volume, open, close)) {
      console.log("Executing trade at hourly candle close...");
      executeTradeLogic(open, high, low, close, volume);
    }
  }
};

const isTradeConditionMet = (volume, open, close) => {
  return volume > 200000 && open > close && open - close > 18;
};

const executeTradeLogic = (open, high, low, close, volume) => {
  // Implement your Binance trade logic here using binance.futuresMarketBuy or binance.futuresMarketSell

  // Save trade details on Airtable
  airtableBase("Trades").create(
    {
      Datetime: Date.now(),
      open,
      high,
      low,
      close,
      volume,
    },
    (err, record) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`Trade details saved. Record ID: ${record.getId()}`);
    }
  );
};

// Initialize the WebSocket and start listening to events
initWebSocket();
