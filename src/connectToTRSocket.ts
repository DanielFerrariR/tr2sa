import WebSocket from 'ws';
import fs from 'fs';
import { Transaction, TransactionResponse } from '../types/transactions';

export const TR_WEBSOCKET_URL = 'wss://api.traderepublic.com/';

const INVESTMENT_TRANSACTIONS = [
  'trading_trade_executed', // trade
  'trading_savingsplan_executed', // savings plan
  'benefits_spare_change_execution', // roundup
  'benefits_saveback_execution', // 15 euros per month
];

const CONNECT_MESSAGE =
  'connect 31 {"locale":"en","platformId":"webtrading","platformVersion":"Chrome/136.0.0.0","clientId":"app.traderepublic.com","clientVersion":"3.282.0"}';

export function connectToTRSocket(trSessionToken: string): WebSocket {
  console.log('Attempting to connect to Trade Republic WebSocket...');
  const websocket = new WebSocket(TR_WEBSOCKET_URL);

  let allItems: Transaction[] = []; // Array to store all collected items
  let currentSubscriptionId = 1; // Starting subscription ID for timelineTransactions (changed from 2 to 1)
  let isFetchingTransactions = false; // Flag to control fetching

  websocket.onopen = async () => {
    console.log('WebSocket connection opened.');
    console.log('Sending initial WebSocket connect message:', CONNECT_MESSAGE);
    websocket.send(CONNECT_MESSAGE);
  };

  websocket.onmessage = async (event) => {
    const rawMessage = event.data.toString();
    console.log('Received raw WebSocket message:', rawMessage);

    // Handle the initial "connected" message
    if (rawMessage === 'connected') {
      console.log('Received "connected" message from server.');
      console.log('\n--- WebSocket Ready ---');
      console.log('Starting automatic fetching of timeline transactions...');

      // Initiate the first timelineTransactions request
      const initialTimelineMessage = `sub ${currentSubscriptionId} {"type":"timelineTransactions", "token": "${trSessionToken}"}`;
      websocket.send(initialTimelineMessage);
      console.log('Sent initial timelineTransactions request.');
      isFetchingTransactions = true; // Set flag to true to start fetching
      return; // Exit to prevent further processing of "connected" message as JSON
    }

    // Attempt to extract and parse the JSON part for other messages
    let jsonPayload: TransactionResponse;
    try {
      // Regular expression to find the JSON part:
      // Looks for a string starting with '{' and ending with '}'
      const jsonMatch = rawMessage.match(/\{.*\}/s); // `s` flag allows . to match newlines
      if (jsonMatch && jsonMatch[0]) {
        jsonPayload = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON object found, it might be a simple status message or other non-JSON content
        console.warn(
          'Received message without a recognizable JSON payload:',
          rawMessage
        );
        return; // Skip further processing if not JSON
      }
    } catch (e) {
      console.error('Error parsing JSON from WebSocket message:', e);
      console.error('Message content that caused error:', rawMessage);
      return; // Skip further processing on parsing error
    }

    // Now, process the extracted JSON payload
    if (isFetchingTransactions) {
      if (
        jsonPayload?.hasOwnProperty('items') &&
        jsonPayload?.hasOwnProperty('cursors')
      ) {
        allItems = allItems.concat(jsonPayload.items);
        console.log(
          `Collected ${jsonPayload.items.length} items. Total items: ${allItems.length}`
        );

        const afterCursor = jsonPayload.cursors.after;

        if (afterCursor) {
          // If 'after' cursor exists, send a new request with 'after' parameter
          currentSubscriptionId++; // Increment subscription ID
          const nextTimelineMessage = `sub ${currentSubscriptionId} {"type":"timelineTransactions", "token": "${trSessionToken}", "after": "${afterCursor}"}`;
          websocket.send(nextTimelineMessage);
          console.log(
            `Sent next timelineTransactions request with after: ${afterCursor}`
          );
        } else {
          // 'after' cursor is null, so all data has been fetched
          console.log('All timeline transactions fetched. Saving to file...');
          isFetchingTransactions = false; // Stop fetching

          // --- ADD THIS FILTERING LOGIC HERE ---
          const filteredItems = allItems.filter((item) =>
            INVESTMENT_TRANSACTIONS.includes(item.eventType)
          );
          console.log(
            `Filtered down to ${filteredItems.length} investment-related transactions.`
          );
          // -------------------------------------

          fs.writeFileSync(
            'all_timeline_transactions.json',
            JSON.stringify(filteredItems, null, 2) // Use filteredItems here
          );
          console.log('Data saved to all_timeline_transactions.json');
          websocket.close(); // Close connection after fetching all data
        }
      } else {
        // This is a JSON message but not a timelineTransactions response
        console.log(
          'Received JSON message that is not a timelineTransactions response:',
          jsonPayload
        );
      }
    }
  };

  websocket.onclose = (event) => {
    console.log(
      `WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`
    );
    process.exit(0); // Exit the process when connection is closed
  };

  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
    process.exit(1); // Exit with an error code
  };

  return websocket;
}
