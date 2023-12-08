import WebSocket from "ws";
import { binanceClient } from "./services.js";

const createWebSocket = async (symbol) => {
  const listenKey = await getListenKey();
  const baseUrl = getWebSocketUrl(listenKey,symbol);
  const ws = new WebSocket(baseUrl);

  return { ws, listenKey };
};

const getListenKey = async () => {
  const keyObj = await binanceClient.getFuturesUserDataListenKey();
  return keyObj.listenKey;
};

const getWebSocketUrl = (listenKey,symbol) => {
  const baseUrl = "wss://fstream-auth.binance.com/ws/";
  return `${baseUrl}${symbol}@continuousKline_1h?listenKey=${listenKey}`;
};

export default createWebSocket;
