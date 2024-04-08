import Airtable from "airtable";
import { USDMClient } from "binance";
import Taapi from "taapi";
import dotenv from "dotenv";

dotenv.config();

// Configure Airtable
Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY });

// Create Airtable base instance
const airtableBase = new Airtable.base("appkdkPqB9ymcxy0R");

// Create Binance client instance
const binanceClient = new USDMClient({
  api_key: process.env.BINANCE_KEY,
  api_secret: process.env.BINANCE_SECRET,
});

// Configure Taapi
const taapi = new Taapi.default(process.env.TAAPI_KEY)
taapi.setDefaultExchange("binance")

export { airtableBase, binanceClient, taapi };
