import { Transaction } from '../types';

export const identifyBuyOrSell = (transaction: Transaction): string => {
  if (
    transaction.subtitle === 'Buy Order' ||
    transaction.subtitle === 'Limit Buy' ||
    transaction.subtitle === 'Saving executed' ||
    transaction.subtitle === 'Round up' ||
    transaction.subtitle === 'Saveback'
  ) {
    return 'Buy';
  }
  return 'Sell';
};
