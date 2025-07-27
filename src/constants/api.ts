export const TRADE_REPUBLIC_API_URL = 'https://api.traderepublic.com';

export const TRADE_REPUBLIC_WEBSOCKET_URL = 'wss://api.traderepublic.com';

export const CONNECTION_MESSAGE =
  'connect 31 {"locale":"en","platformId":"webtrading","platformVersion":"Chrome/136.0.0.0","clientId":"app.traderepublic.com","clientVersion":"3.282.0"}';

export enum SUBSCRIPTION_TYPES {
  'TRANSACTIONS' = 'timelineTransactions', // Transactions
  'TRANSACTION_DETAILS' = 'timelineDetailV2', // Additional details for a specific transaction
  'ACTIVITIES' = 'timelineActivityLog', // The list of activities
  'CASH' = 'cash', // Cash balance
}

export const CONNECTION_STATUS = {
  UNKNOWN: -1, // This is not a valid WebSocket state, but can be used to indicate an unknown state
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

export const RECEIVED_COMMAND_TYPES = {
  KEEP_ALIVE: 'C',
  DATA: 'A', // Data message which contains a JSON payload
};
