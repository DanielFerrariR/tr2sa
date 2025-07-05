import WebSocket from 'ws';
import { Transaction, TransactionResponse } from '../types/transactions';
import { TRANSATION_EVENT_TYPE } from './constants/transactions';

export const TR_WEBSOCKET_URL = 'wss://api.traderepublic.com/';

const INVESTMENT_TRANSACTIONS = [
  TRANSATION_EVENT_TYPE.trading_trade_executed,
  TRANSATION_EVENT_TYPE.trading_savingsplan_executed,
  TRANSATION_EVENT_TYPE.benefits_spare_change_execution,
  TRANSATION_EVENT_TYPE.benefits_saveback_execution,
];

const CONNECT_MESSAGE =
  'connect 31 {"locale":"en","platformId":"webtrading","platformVersion":"Chrome/136.0.0.0","clientId":"app.traderepublic.com","clientVersion":"3.282.0"}';

export async function connectToTRSocket(
  trSessionToken: string
): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    console.log('Attempting to connect to Trade Republic WebSocket...');
    const websocket = new WebSocket(TR_WEBSOCKET_URL);

    let allItems: Transaction[] = []; // Array to store all collected items
    let currentSubscriptionId = 1; // Starting subscription ID for timelineTransactions
    let isFetchingTransactions = false; // Flag to control fetching

    websocket.onopen = async () => {
      console.log('WebSocket connection opened.');
      console.log(
        'Sending initial WebSocket connect message:',
        CONNECT_MESSAGE
      );
      websocket.send(CONNECT_MESSAGE);
    };

    websocket.onmessage = async (event) => {
      const rawMessage = event.data.toString();
      console.log('Received raw WebSocket message:', rawMessage);

      if (rawMessage === 'connected') {
        console.log('Received "connected" message from server.');
        console.log('\n--- WebSocket Ready ---');
        console.log('Starting automatic fetching of timeline transactions...');

        const initialTimelineMessage = `sub ${currentSubscriptionId} {"type":"timelineTransactions", "token": "${trSessionToken}"}`;
        websocket.send(initialTimelineMessage);
        console.log('Sent initial timelineTransactions request.');
        isFetchingTransactions = true;
        return;
      }

      let jsonPayload: TransactionResponse;
      try {
        const jsonMatch = rawMessage.match(/\{.*\}/s);
        if (jsonMatch && jsonMatch[0]) {
          jsonPayload = JSON.parse(jsonMatch[0]);
        } else {
          console.warn(
            'Received message without a recognizable JSON payload:',
            rawMessage
          );
          return;
        }
      } catch (e) {
        console.error('Error parsing JSON from WebSocket message:', e);
        console.error('Message content that caused error:', rawMessage);
        return;
      }

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
            currentSubscriptionId++;
            const nextTimelineMessage = `sub ${currentSubscriptionId} {"type":"timelineTransactions", "token": "${trSessionToken}", "after": "${afterCursor}"}`;
            websocket.send(nextTimelineMessage);
            console.log(
              `Sent next timelineTransactions request with after: ${afterCursor}`
            );
          } else {
            console.log('All timeline transactions fetched.');
            isFetchingTransactions = false;

            const filteredItems = allItems.filter((item) =>
              INVESTMENT_TRANSACTIONS.includes(item.eventType)
            );
            console.log(
              `Filtered down to ${filteredItems.length} investment-related transactions.`
            );

            // Resolve the promise with the filtered items
            websocket.close();
            resolve(filteredItems);
          }
        } else {
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
      // If the connection closes before resolution, reject the promise
      if (isFetchingTransactions) {
        reject(
          new Error(
            `WebSocket closed unexpectedly during fetch: Code ${event.code}, Reason: ${event.reason}`
          )
        );
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(error); // Reject the promise on error
    };
  });
}
