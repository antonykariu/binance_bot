import WebSocket from "ws";
import { binanceClient } from "./services.js";

const createWebSocket = async (symbol) => {
  const listenKey = await getListenKey();
  const baseUrl = getWebSocketUrl(listenKey, symbol);
  console.log(baseUrl)
  const ws = new WebSocket(baseUrl);

  return { ws, listenKey };
};

const getListenKey = async () => {
  const keyObj = await binanceClient.getFuturesUserDataListenKey();
  return keyObj.listenKey;
};

const getWebSocketUrl = (listenKey,symbol) => {
  const baseUrl = "wss://fstream.binance.com/ws/";
  return `${baseUrl}${listenKey}/${symbol}@continuousKline_15m`;
};

export default createWebSocket;