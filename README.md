# Trading WebSocket Integration

This project combines WebSocket communication with the Binance API for trading and Airtable for recording trade details.

## Prerequisites

Before running the code, ensure you have the following installed:

- Node.js
- npm (Node Package Manager)

## Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    ```

2. Navigate to the project directory:

    ```bash
    cd trading-websocket
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Create a `.env` file in the project root and set the following environment variables:

    ```env
    AIRTABLE_API_KEY=your_airtable_api_key
    BINANCE_KEY=your_binance_api_key
    BINANCE_SECRET=your_binance_api_secret
    ```

## Usage

To initiate the WebSocket connection and start trading:

```bash
npm start
```

## Code Structure

### `services.js`

- Configures Airtable and exports the Airtable base instance.
- Creates a Binance client instance and exports it.

### `websocket.js`

- Initializes the WebSocket connection to Binance using the Binance client.
- Listens to WebSocket events such as "open," "message," "close," and "error."
- Handles the WebSocket messages, checks trade conditions, and executes trade logic.
- Saves trade details to Airtable.

### `index.js`

- Imports and initializes the WebSocket.
- Starts listening to WebSocket events and handles trading logic.

## Contributing

If you would like to contribute to this project, please follow the standard GitHub flow:

1. Fork the repository
2. Create a branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Feel free to modify the sections based on your project's specific details.