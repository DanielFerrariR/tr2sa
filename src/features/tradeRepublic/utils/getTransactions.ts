import fs from 'fs';
import path from 'path';
import {
  RECEIVED_COMMAND_TYPES,
  SUBSCRIPTION_TYPES,
  TransactionTableSection,
  TradeRepublicAPI,
  Transaction,
  TransactionDetailsResponse,
  TransactionResponse,
} from '../tradeRepublicApi';

const OUTPUT_DIR = 'build';
const TRANSACTIONS_FILENAME = 'transactions.json';
const TRANSACTIONS_WITH_DETAILS_FILENAME = 'transactions_with_details.json';

export async function getTransactions(): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    let allItems: Transaction[] = [];
    let transactionsToFetchDetailsFor: Set<string> = new Set();

    const saveTransactions = (data: Transaction[], filename: string) => {
      const filePath = path.join(process.cwd(), `${OUTPUT_DIR}/${filename}`);

      if (!fs.existsSync(OUTPUT_DIR))
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      fs.writeFile(filePath, JSON.stringify(data, null, 2), (error) => {
        if (error) {
          console.error(`Error saving JSON file "${filename}".`, error);
        } else {
          console.log(
            `JSON file "${filename}" successfully saved to ${filePath}.`,
          );
        }
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
          console.log('Starting automatic fetching of transactions...');

          TradeRepublicAPI.getInstance().sendTransactionsMessage();
          console.log('Sent initial transactions request.');
        } catch (error) {
          console.error('Error during initial connection:', error);
          reject(error);
        }
      },
      onMessage: (message, { command, jsonPayload, subscriptionType }) => {
        // We don't want to see logs of keep-alive messages
        if (command === RECEIVED_COMMAND_TYPES.KEEP_ALIVE) return;

        // Just to debug because we don't expect any message that isn't a transaction,
        // transactionDetails or keep-alive here
        if (!jsonPayload) {
          console.log(`Received message: ${message}`);
          return;
        }

        if (subscriptionType === SUBSCRIPTION_TYPES.TRANSACTIONS) {
          try {
            const transactionResponse = jsonPayload as TransactionResponse;

            allItems = allItems.concat(transactionResponse.items);
            console.log(
              `Collected ${transactionResponse.items.length} items. Total items: ${allItems.length}`,
            );

            const afterCursor = transactionResponse.cursors.after;
            if (afterCursor) {
              TradeRepublicAPI.getInstance().sendTransactionsMessage(
                afterCursor,
              );
              console.log(
                `Sent next transactions request with after: ${afterCursor}`,
              );
            } else {
              console.log('All transactions fetched.');
              saveTransactions(allItems, TRANSACTIONS_FILENAME);

              if (allItems.length === 0) {
                console.log(
                  'No transactions found. Exiting without fetching details.',
                );
                TradeRepublicAPI.getInstance().disconnect();
                resolve(allItems);
                return;
              }

              console.log('Starting to fetch details for each transaction.');
              for (const transaction of allItems) {
                transactionsToFetchDetailsFor.add(transaction.id);
              }
              for (const transaction of allItems) {
                TradeRepublicAPI.getInstance().sendTransactionDetailsMessage(
                  transaction.id,
                );
              }
            }
          } catch (error) {
            console.error('Error processing transaction message:', message);
            reject(error);
          }
        }

        if (subscriptionType === SUBSCRIPTION_TYPES.TRANSACTION_DETAILS) {
          try {
            const transactionDetailsResponse =
              jsonPayload as TransactionDetailsResponse;

            // Somestimes the transactionId doesn't match the transactionDetailsId (not sure why)
            // So we need to find the transactionId in the support section
            let sectionTransactionId: string | undefined;
            transactionDetailsResponse.sections.forEach((section) => {
              if (
                (section as TransactionTableSection).data?.[0]?.detail?.action
                  ?.payload?.contextParams?.timelineEventId
              ) {
                sectionTransactionId = (section as TransactionTableSection)
                  .data?.[0]?.detail?.action?.payload?.contextParams
                  ?.timelineEventId;
              }
            });

            let transactionId = jsonPayload.id;
            const transactionIndex = allItems.findIndex((item) => {
              if (item.id === sectionTransactionId) {
                transactionId = sectionTransactionId;
                return true;
              }
              return item.id === jsonPayload.id;
            });

            if (transactionIndex !== -1) {
              allItems[transactionIndex].sections =
                transactionDetailsResponse.sections;
              console.log(
                `Attached sections for transaction ID: ${transactionId}`,
              );
              transactionsToFetchDetailsFor.delete(transactionId);

              console.log(
                `transactionsToFetchDetailsFor current size: ${transactionsToFetchDetailsFor.size}`,
              );

              if (transactionsToFetchDetailsFor.size === 0) {
                console.log('All transaction details fetched.');
                saveTransactions(allItems, TRANSACTIONS_WITH_DETAILS_FILENAME);
                TradeRepublicAPI.getInstance().disconnect();
                resolve(allItems);
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
