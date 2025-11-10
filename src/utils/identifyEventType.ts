import { ACTIVITY_EVENT_TYPE, TRANSACTION_EVENT_TYPE } from '../constants';
import { Activity, Transaction } from '../types';

export const identifyTransactionEventType = (
  transaction: Transaction,
): TRANSACTION_EVENT_TYPE | null => {
  // Dividends
  if (transaction.subtitle === 'Cash dividend') {
    return TRANSACTION_EVENT_TYPE.SSP_CORPORATE_ACTION_INVOICE_CASH;
  }

  // Buy, Sell, Limit Buy, Limit Sell Orders
  if (
    transaction.subtitle === 'Buy Order' ||
    transaction.subtitle === 'Sell Order' ||
    transaction.subtitle === 'Limit Buy' ||
    transaction.subtitle === 'Limit Sell'
  ) {
    return TRANSACTION_EVENT_TYPE.TRADING_TRADE_EXECUTED;
  }

  // Savings plans
  if (transaction.subtitle === 'Saving executed') {
    return TRANSACTION_EVENT_TYPE.TRADING_SAVINGSPLAN_EXECUTED;
  }

  // Round ups
  if (transaction.subtitle === 'Round up') {
    return TRANSACTION_EVENT_TYPE.BENEFITS_SPARE_CHANGE_EXECUTION;
  }

  // Saveback (15 euros per month bonus)
  if (transaction.subtitle === 'Saveback') {
    return TRANSACTION_EVENT_TYPE.BENEFITS_SAVEBACK_EXECUTION;
  }

  // Interest
  if (transaction.title === 'Interest') {
    return TRANSACTION_EVENT_TYPE.INTEREST_PAYOUT;
  }

  // Tax corrections
  if (transaction.subtitle === 'Cash dividend corrected') {
    return TRANSACTION_EVENT_TYPE.SSP_TAX_CORRECTION_INVOICE;
  }

  return null;
};

export const identifyActivityEventType = (
  activity: Activity,
): ACTIVITY_EVENT_TYPE | null => {
  // Stock Gift
  if (activity.title === 'Stock Gift' && activity.subtitle === 'Accepted') {
    return ACTIVITY_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY;
  }

  // Stock Perk
  if (activity.title === 'Stock Perk' && activity.subtitle === 'Redeemed') {
    return ACTIVITY_EVENT_TYPE.STOCK_PERK_REFUNDED;
  }

  return null;
};
