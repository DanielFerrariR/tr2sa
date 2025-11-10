import { saveFile } from './saveFile';
import {
  Transaction,
  TransactionDetailsResponse,
  TransactionResponse,
  Activity,
  ActivityResponse,
  TransactionTableSection,
  CashResponse,
} from '../types';
import { TradeRepublicAPI } from '../api';
import {
  ACTIVITY_EVENT_TYPE,
  CURRENCY_TO_SIGN_MAP,
  RECEIVED_COMMAND_TYPES,
  SUBSCRIPTION_TYPES,
  TRANSACTION_EVENT_TYPE,
} from '../constants';
import {
  identifyActivityEventType,
  identifyTransactionEventType,
} from './identifyEventType';

const OUTPUT_DIRECTORY = 'build';
const TRANSACTIONS_FILE_NAME = 'transactions.json';
const ACTIVITIES_FILE_NAME = 'activities.json';
const TRANSACTIONS_WITH_DETAILS_FILE_NAME = 'transactions_with_details.json';

export const getTransactions = async (): Promise<Transaction[]> =>
  new Promise((resolve, reject) => {
    let activities: Activity[] = [];
    let transactions: Transaction[] = [];
    let transactionsToFetchDetailsFor = new Set<string>();

    TradeRepublicAPI.getInstance().connect({
      onOpen: () => {
        console.log('WebSocket connection opened.');
      },
      onConnected: () => {
        try {
          console.log('Received "connected" message from server.');
          console.log('\n--- WebSocket Ready ---');
          console.log('Starting automatic fetching of transactions...');

          TradeRepublicAPI.getInstance().sendSubscriptionMessage(
            SUBSCRIPTION_TYPES.ACTIVITIES,
          );
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

        if (subscription?.type === SUBSCRIPTION_TYPES.ACTIVITIES) {
          try {
            const activityResponse = jsonPayload as ActivityResponse;
            activities = activities.concat(activityResponse.items);

            const after = activityResponse.cursors.after;
            if (after) {
              TradeRepublicAPI.getInstance().sendSubscriptionMessage(
                SUBSCRIPTION_TYPES.ACTIVITIES,
                { after },
              );
              return;
            }

            console.log('All activities fetched.');
            saveFile(
              JSON.stringify(activities, null, 2),
              ACTIVITIES_FILE_NAME,
              OUTPUT_DIRECTORY,
            );
            TradeRepublicAPI.getInstance().sendSubscriptionMessage(
              SUBSCRIPTION_TYPES.TRANSACTIONS,
            );
            console.log('Sent initial transactions request.');
          } catch (error) {
            console.error('Error processing activity message:', message);
            reject(error);
          }
        }

        if (subscription?.type === SUBSCRIPTION_TYPES.TRANSACTIONS) {
          try {
            const transactionResponse = jsonPayload as TransactionResponse;
            transactions.push(...transactionResponse.items);

            const after = transactionResponse.cursors.after;
            if (after) {
              TradeRepublicAPI.getInstance().sendSubscriptionMessage(
                SUBSCRIPTION_TYPES.TRANSACTIONS,
                { after },
              );
              return;
            }

            transactions = transactions
              .map((transaction) => ({
                ...transaction,
                eventType:
                  identifyTransactionEventType(transaction) ?? undefined,
              }))
              .filter((transaction) => !!transaction.eventType);

            // Adding fake received gift transactions from activities as transactions list doesn't include received gifts
            const giftTransactions: Transaction[] = activities
              .map((activity) => ({
                ...activity,
                eventType: identifyActivityEventType(activity) ?? undefined,
              }))
              .filter(
                (activity) =>
                  !!activity.eventType &&
                  [
                    ACTIVITY_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY,
                    ACTIVITY_EVENT_TYPE.STOCK_PERK_REFUNDED,
                  ].includes(activity.eventType),
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
                  value: 0, // Will be added later in the transaction details
                  fractionDigits: 2,
                },
                subAmount: null,
                status: 'EXECUTED',
                action: {
                  type: 'timelineDetail',
                  payload: activity.id,
                },
                eventType:
                  activity.eventType ===
                  ACTIVITY_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY
                    ? TRANSACTION_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY
                    : TRANSACTION_EVENT_TYPE.STOCK_PERK_REFUNDED,
                cashAccountNumber: null,
                hidden: false,
                deleted: false,
              }));
            transactions.push(...giftTransactions);
            transactions.sort(
              (transactionA, transactionB) =>
                new Date(transactionB.timestamp).getTime() -
                new Date(transactionA.timestamp).getTime(),
            );
            //

            console.log('All transactions fetched.');
            saveFile(
              JSON.stringify(transactions, null, 2),
              TRANSACTIONS_FILE_NAME,
              OUTPUT_DIRECTORY,
            );

            console.log('Starting to fetch details for each transaction.');
            for (const transaction of transactions) {
              transactionsToFetchDetailsFor.add(transaction.id);
            }
            for (const transaction of transactions) {
              TradeRepublicAPI.getInstance().sendSubscriptionMessage(
                SUBSCRIPTION_TYPES.TRANSACTION_DETAILS,
                { id: transaction.id },
              );
            }
          } catch (error) {
            console.error('Error processing transaction message:', message);
            reject(error);
          }
        }

        if (
          subscription?.type === SUBSCRIPTION_TYPES.TRANSACTION_DETAILS &&
          subscription.id
        ) {
          try {
            const transactionDetailsResponse =
              jsonPayload as TransactionDetailsResponse;

            const transactionIndex = transactions.findIndex(
              (item) => item.id === subscription.id,
            );

            if (transactionIndex === -1) {
              console.warn(
                `Received details for unknown transaction ID: ${subscription.id}`,
              );
              return;
            }

            const transaction = transactions[transactionIndex];

            // Adding gift amount to the transaction if it's a received gift
            if (
              transaction.eventType ===
              TRANSACTION_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY
            ) {
              transaction.sections?.forEach((section) => {
                if ('title' in section && section.title === 'Transaction') {
                  const tableSection = section as TransactionTableSection;
                  const totalSubSection = tableSection.data.find(
                    (subSection) => subSection.title === 'Total',
                  );
                  transaction.amount.value = Number(
                    totalSubSection?.detail?.text?.slice(1) ?? 0,
                  );
                }
              });
            }
            //

            transaction.sections = transactionDetailsResponse.sections;
            transactionsToFetchDetailsFor.delete(subscription.id);

            if (transactionsToFetchDetailsFor.size !== 0) return;

            console.log('All transaction details fetched.');
            saveFile(
              JSON.stringify(transactions, null, 2),
              TRANSACTIONS_WITH_DETAILS_FILE_NAME,
              OUTPUT_DIRECTORY,
            );
            console.log('Starting to fetch the current cash balance.');
            TradeRepublicAPI.getInstance().sendSubscriptionMessage(
              SUBSCRIPTION_TYPES.CASH,
            );
          } catch (error) {
            console.error(
              'Error processing transaction details message:',
              message,
            );
            reject(error);
          }
        }

        if (subscription?.type === SUBSCRIPTION_TYPES.CASH) {
          const cashResponse = jsonPayload as CashResponse;
          const currency = CURRENCY_TO_SIGN_MAP[cashResponse.currencyId];
          let amount = cashResponse.amount;

          console.log(`Your current cash balance is: ${amount} ${currency}`);
          console.log(
            `Please follow the steps in the README to manually add your cash balance in the Snowball Analytics app.`,
          );
          TradeRepublicAPI.getInstance().disconnect();
          resolve(transactions);
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
