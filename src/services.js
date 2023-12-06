import Airtable from "airtable";
import { USDMClient } from "binance";
import dotenv from "dotenv";

dotenv.config();

// Configure Airtable
Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY });

// Create Airtable base instance
const airtableBase = new Airtable.base("appgLyf2bQLHIf4gM");

// Create Binance client instance
const binanceClient = new USDMClient({
  api_key: process.env.BINANCE_KEY,
  api_secret: process.env.BINANCE_SECRET,
});

export { airtableBase, binanceClient };
