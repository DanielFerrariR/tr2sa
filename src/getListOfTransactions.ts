import fs from 'fs';
import path from 'path';
import { TradeRepublicAPI } from './api';
import { Transaction, TransactionResponse } from '../types';

const OUTPUT_DIR = 'build';
const FILENAME = 'all_timeline_transactions.json';

export async function getListOfTransactions(): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    let allItems: Transaction[] = [];
    let currentSubscriptionId = 1;
    let isFetchingTransactions = false;

    TradeRepublicAPI.getInstance().connect({
      onOpen: () => {
        console.log('WebSocket connection opened.');
      },
      onConnected: () => {
        console.log('Received "connected" message from server.');
        console.log('\n--- WebSocket Ready ---');
        console.log('Starting automatic fetching of timeline transactions...');

        const initialTimelineMessage = `sub ${currentSubscriptionId} {"type":"timelineTransactions"}`;
        TradeRepublicAPI.getInstance().sendMessage(initialTimelineMessage);
        console.log('Sent initial timelineTransactions request.');
        isFetchingTransactions = true;
      },
      onMessage: (message) => {
        let jsonPayload: TransactionResponse;
        try {
          const jsonMatch = message.match(/\{.*\}/s);
          if (jsonMatch && jsonMatch[0]) {
            jsonPayload = JSON.parse(jsonMatch[0]);
          } else {
            console.warn(
              'Received message without a recognizable JSON payload:',
              message,
            );
            return;
          }
        } catch (error) {
          console.error('Error parsing JSON from WebSocket message:', error);
          console.error('Message content that caused error:', message);
          return;
        }

        if (isFetchingTransactions) {
          if (
            jsonPayload?.hasOwnProperty('items') &&
            jsonPayload?.hasOwnProperty('cursors')
          ) {
            allItems = allItems.concat(jsonPayload.items);
            console.log(
              `Collected ${jsonPayload.items.length} items. Total items: ${allItems.length}`,
            );

            const afterCursor = jsonPayload.cursors.after;

            if (afterCursor) {
              currentSubscriptionId++;
              const nextTimelineMessage = `sub ${currentSubscriptionId} {"type":"timelineTransactions", "after": "${afterCursor}"}`;
              TradeRepublicAPI.getInstance().sendMessage(nextTimelineMessage);
              console.log(
                `Sent next timelineTransactions request with after: ${afterCursor}`,
              );
            } else {
              console.log('All timeline transactions fetched.');
              isFetchingTransactions = false;

              const filePath = path.join(
                process.cwd(),
                `${OUTPUT_DIR}/${FILENAME}`,
              );

              if (!fs.existsSync(OUTPUT_DIR))
                fs.mkdirSync(OUTPUT_DIR, { recursive: true });

              fs.writeFile(filePath, JSON.stringify(allItems), (error) => {
                if (error) {
                  console.error(`Error saving JSON file "${FILENAME}".`, error);
                } else {
                  console.log(
                    `JSON file "${FILENAME}" successfully saved to ${filePath}.`,
                  );
                }
              });

              TradeRepublicAPI.getInstance().disconnect();
              resolve(allItems);
            }
          } else {
            console.log(
              'Received JSON message that is not a timelineTransactions response:',
              jsonPayload,
            );
          }
        }
      },
      onClose: (event) => {
        console.log(
          `WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`,
        );
        if (isFetchingTransactions) {
          reject(
            new Error(
              `WebSocket closed unexpectedly during fetch: Code ${event.code}, Reason: ${event.reason}`,
            ),
          );
        }
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      },
    });
  });
}
