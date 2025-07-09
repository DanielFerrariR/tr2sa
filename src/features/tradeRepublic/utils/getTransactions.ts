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
  Activity,
  ActivityResponse,
  ACTIVITY_EVENT_TYPE,
  TRANSATION_EVENT_TYPE,
} from '../tradeRepublicApi';

const OUTPUT_DIR = 'build';
const TRANSACTIONS_FILENAME = 'transactions.json';
const ACTIVITIES_FILENAME = 'activities.json';
const TRANSACTIONS_WITH_DETAILS_FILENAME = 'transactions_with_details.json';

export async function getTransactions(): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    let activities: Activity[] = [];
    let transactions: Transaction[] = [];
    let transactionsToFetchDetailsFor: Set<string> = new Set();

    const saveFile = (data: any, filename: string) => {
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

          TradeRepublicAPI.getInstance().sendActivitiesMessage();
          console.log('Sent initial activity request.');
        } catch (error) {
          console.error('Error during initial connection:', error);
          reject(error);
        }
      },
      onMessage: (message, { command, jsonPayload, subscription }) => {
        // We don't want to see logs of keep-alive messages
        if (command === RECEIVED_COMMAND_TYPES.KEEP_ALIVE) return;

        // Just to debug because we don't expect any message that isn't a activity, transaction,
        // transactionDetails or keep-alive here
        if (!jsonPayload) {
          console.log(`Received message: ${message}`);
          return;
        }

        if (subscription.type === SUBSCRIPTION_TYPES.ACTIVITIES) {
          try {
            const activityResponse = jsonPayload as ActivityResponse;

            activities = activities.concat(activityResponse.items);
            console.log(
              `Collected ${activityResponse.items.length} items. Total items: ${activities.length}`,
            );

            const afterCursor = activityResponse.cursors.after;
            if (afterCursor) {
              TradeRepublicAPI.getInstance().sendActivitiesMessage(afterCursor);
              console.log(
                `Sent next activities request with after: ${afterCursor}`,
              );
            } else {
              console.log('All activities fetched.');
              saveFile(activities, ACTIVITIES_FILENAME);
              TradeRepublicAPI.getInstance().sendTransactionsMessage();
              console.log('Sent initial transactions request.');
            }
          } catch (error) {
            console.error('Error processing transaction message:', message);
            reject(error);
          }
        }

        if (subscription.type === SUBSCRIPTION_TYPES.TRANSACTIONS) {
          try {
            const transactionResponse = jsonPayload as TransactionResponse;

            transactions.push(...transactionResponse.items);
            console.log(
              `Collected ${transactionResponse.items.length} items. Total items: ${transactions.length}`,
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

              // Adding fake received gift transactions from activities as transactions list doesn't include received gifts
              const giftTransactions: Transaction[] = activities
                .filter(
                  (activity) =>
                    activity.eventType ===
                    ACTIVITY_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY,
                )
                .map((activity) => ({
                  id: activity.id,
                  timestamp: activity.timestamp,
                  title: activity.title,
                  icon: activity.icon,
                  badge: null,
                  subtitle: activity.subtitle,
                  amount: {
                    currency: 'EUR',
                    value: 0,
                    fractionDigits: 2,
                  },
                  subAmount: null,
                  status: 'EXECUTED',
                  action: {
                    type: 'timelineDetail',
                    payload: activity.id,
                  },
                  eventType: TRANSATION_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY,
                  cashAccountNumber: null,
                  hidden: false,
                  deleted: false,
                }));
              transactions.push(...giftTransactions);
              console.log(
                `Added ${giftTransactions.length} received gifts to the transactions. Total items: ${transactions.length}`,
              );

              saveFile(transactions, TRANSACTIONS_FILENAME);
              console.log('Starting to fetch details for each transaction.');
              for (const transaction of transactions) {
                transactionsToFetchDetailsFor.add(transaction.id);
              }
              for (const transaction of transactions) {
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

        if (subscription.type === SUBSCRIPTION_TYPES.TRANSACTION_DETAILS) {
          try {
            const transactionDetailsResponse =
              jsonPayload as TransactionDetailsResponse;

            const transactionIndex = transactions.findIndex(
              (item) => item.id === subscription.id,
            );

            if (transactionIndex !== -1) {
              transactions[transactionIndex].sections =
                transactionDetailsResponse.sections;
              console.log(
                `Attached sections for transaction ID: ${subscription.id}`,
              );
              transactionsToFetchDetailsFor.delete(subscription.id);

              console.log(
                `transactionsToFetchDetailsFor current size: ${transactionsToFetchDetailsFor.size}`,
              );

              if (transactionsToFetchDetailsFor.size === 0) {
                console.log('All transaction details fetched.');
                saveFile(transactions, TRANSACTIONS_WITH_DETAILS_FILENAME);
                TradeRepublicAPI.getInstance().disconnect();
                resolve(transactions);
              }
            } else {
              console.warn(
                `Received details for unknown transaction ID: ${subscription.id}`,
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
