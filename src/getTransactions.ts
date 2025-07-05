import fs from 'fs';
import path from 'path';
import { RECEIVED_COMMAND_TYPES, TradeRepublicAPI } from './api';
import {
  Transaction,
  TransactionDetailsResponse,
  TransactionResponse,
} from '../types';
import { TRANSACTION_WITHOUT_DETAILS } from './constants';

const OUTPUT_DIR = 'build';
const FILENAME = 'all_timeline_transactions.json';

export async function getTransactions(): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    let allItems: Transaction[] = [];
    let transactionsToFetchDetailsFor: Set<string> = new Set();
    let fetchedDetailsCount = 0;

    const saveAndResolve = (data: Transaction[]) => {
      const filePath = path.join(process.cwd(), `${OUTPUT_DIR}/${FILENAME}`);

      if (!fs.existsSync(OUTPUT_DIR))
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      fs.writeFile(filePath, JSON.stringify(data, null, 2), (error) => {
        if (error) {
          console.error(`Error saving JSON file "${FILENAME}".`, error);
        } else {
          console.log(
            `JSON file "${FILENAME}" successfully saved to ${filePath}.`,
          );
        }
        TradeRepublicAPI.getInstance().disconnect();
        resolve(data);
      });
    };

    TradeRepublicAPI.getInstance().connect({
      onOpen: () => {
        console.log('WebSocket connection opened.');
      },
      onConnected: () => {
        try {
          console.log('Received "connected" message from server.');
          console.log('\n--- WebSocket Ready ---');
          console.log(
            'Starting automatic fetching of timeline transactions...',
          );

          TradeRepublicAPI.getInstance().sendTransactionsMessage();
          console.log('Sent initial timelineTransactions request.');
        } catch (error) {
          console.error('Error during initial connection:', error);
          reject(error);
        }
      },
      onMessage: (message, { command }) => {
        if (command === RECEIVED_COMMAND_TYPES.KEEP_ALIVE) return;
        console.log(`Received message: ${message}`);
      },
      onTransactionMessage: (message, { command, jsonPayload }) => {
        if (!jsonPayload || command === RECEIVED_COMMAND_TYPES.KEEP_ALIVE) {
          return;
        }

        try {
          allItems = allItems.concat(jsonPayload.items);
          console.log(
            `Collected ${jsonPayload.items.length} items. Total items: ${allItems.length}`,
          );

          const afterCursor = jsonPayload.cursors.after;
          if (afterCursor) {
            TradeRepublicAPI.getInstance().sendTransactionsMessage(afterCursor);
            console.log(
              `Sent next timelineTransactions request with after: ${afterCursor}`,
            );
          } else {
            console.log('All initial timeline transactions fetched.');

            if (allItems.length === 0) {
              console.log(
                'No transactions found. Exiting without fetching details.',
              );
              saveAndResolve(allItems);
              return;
            }

            console.log('Starting to fetch details for each transaction...');
            allItems
              .filter((item) =>
                TRANSACTION_WITHOUT_DETAILS.includes(item.eventType),
              )
              .forEach((transaction) => {
                transactionsToFetchDetailsFor.add(transaction.id);
                TradeRepublicAPI.getInstance().sendTransactionDetailsMessage(
                  transaction.id,
                );
              });
          }
        } catch (error) {
          console.error('Error processing transaction message:', message);
          reject(error);
        }
      },
      onTransactionDetailsMessage: (message, { command, jsonPayload }) => {
        if (!jsonPayload || command === RECEIVED_COMMAND_TYPES.KEEP_ALIVE) {
          return;
        }

        try {
          const transactionId = jsonPayload.id;
          const transactionIndex = allItems.findIndex(
            (item) => item.id === transactionId,
          );

          if (transactionIndex !== -1) {
            allItems[transactionIndex].sections = jsonPayload.sections;
            console.log(
              `Attached sections for transaction ID: ${transactionId}`,
            );
            fetchedDetailsCount++;
            transactionsToFetchDetailsFor.delete(transactionId);

            console.log(transactionsToFetchDetailsFor);

            if (
              transactionsToFetchDetailsFor.size === 0 &&
              allItems.length > 0
            ) {
              console.log('All transaction details fetched.');
              saveAndResolve(allItems);
            }
          } else {
            console.warn(
              `Received details for unknown transaction ID: ${transactionId}`,
            );
          }
        } catch (error) {
          console.error(
            'Error processing transaction details message:',
            message,
          );
          reject(error);
        }
      },
      onClose: (event) => {
        console.log(
          `WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`,
        );
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      },
    });
  });
}
