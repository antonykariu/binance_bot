import WebSocket from "ws";
import { binanceClient } from "./services.js";

const symbol = "ethusdt_perpetual";

const createWebSocket = async () => {
  const listenKey = await getListenKey();
  const baseUrl = getWebSocketUrl(listenKey);
  const ws = new WebSocket(baseUrl);

  return { ws, listenKey };
};

const getListenKey = async () => {
  const keyObj = await binanceClient.getFuturesUserDataListenKey();
  return keyObj.listenKey;
};

const getWebSocketUrl = (listenKey) => {
  const baseUrl = "wss://fstream-auth.binance.com/ws/";
  return `${baseUrl}${symbol}@continuousKline_1h?listenKey=${listenKey}`;
};

export default createWebSocket;
